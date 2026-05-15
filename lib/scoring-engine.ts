// Scoring Engine
// Calculates final scores, confidence levels, and targets

import type { TechnicalIndicators, Signal, ScanResult } from './scanner-types';
import { SIGNAL_POINTS, MAX_BUY_POINTS } from './scanner-types';
import { analyzeSignals, countSignals } from './signal-engine';
import { findSector } from './bist-stocks';

interface ScoreInput {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  indicators: TechnicalIndicators;
  currentVolume: number;
}

/**
 * Calculate total score from signals
 */
function calculateTotalScore(signals: Signal[]): number {
  return signals.reduce((total, signal) => total + signal.points, 0);
}

/**
 * Calculate confluence bonus (multiple buy signals aligning)
 */
function calculateConfluenceBonus(signals: Signal[]): number {
  const buySignals = signals.filter(s => s.type === 'buy');
  const uniqueCategories = new Set(buySignals.map(s => s.category));
  
  if (uniqueCategories.size >= 3) {
    return SIGNAL_POINTS.CONFLUENCE_3_PLUS;
  } else if (uniqueCategories.size >= 2) {
    return SIGNAL_POINTS.CONFLUENCE_2_SIGNALS;
  }
  
  return 0;
}

/**
 * Calculate target price based on technical levels
 */
function calculateTargetPrice(
  currentPrice: number,
  indicators: TechnicalIndicators
): { targetPrice: number; expectedGainPercent: number } {
  // Minimum %1 target
  const minTarget = currentPrice * 1.01;
  
  // ATR-based target (0.5 ATR)
  const atrTarget = currentPrice + (indicators.atr * 0.5);
  
  // Bollinger middle band target
  const bbTarget = indicators.bollingerBands.middle;
  
  // Average 5-day move target
  const avgMoveTarget = currentPrice + indicators.avgDailyMove5Days;
  
  // Use the most conservative target that's at least 1%
  const targets = [atrTarget, avgMoveTarget];
  
  // Add BB middle only if it's above current price
  if (bbTarget > currentPrice * 1.005) {
    targets.push(bbTarget);
  }
  
  // Find the most realistic target (smallest positive gain that's at least 1%)
  const validTargets = targets.filter(t => t >= minTarget);
  const targetPrice = validTargets.length > 0 
    ? Math.min(...validTargets) 
    : minTarget;
  
  const expectedGainPercent = ((targetPrice - currentPrice) / currentPrice) * 100;
  
  return {
    targetPrice: Math.round(targetPrice * 100) / 100,
    expectedGainPercent: Math.round(expectedGainPercent * 100) / 100,
  };
}

/**
 * Calculate stop loss level
 */
function calculateStopLoss(
  currentPrice: number,
  indicators: TechnicalIndicators
): { stopLoss: number; stopLossPercent: number } {
  // ATR-based stop loss (1.5 ATR below)
  const atrStop = currentPrice - (indicators.atr * 1.5);
  
  // Bollinger lower band as stop
  const bbStop = indicators.bollingerBands.lower;
  
  // Use the higher stop loss (less risk)
  const stopLoss = Math.max(atrStop, bbStop);
  const stopLossPercent = ((currentPrice - stopLoss) / currentPrice) * 100;
  
  return {
    stopLoss: Math.round(stopLoss * 100) / 100,
    stopLossPercent: Math.round(stopLossPercent * 100) / 100,
  };
}

/**
 * Calculate risk score (1-10)
 */
function calculateRiskScore(
  indicators: TechnicalIndicators,
  dayChangePercent: number,
  volumeRatio: number
): { score: number; level: 'low' | 'medium' | 'high'; factors: string[] } {
  let riskScore = 5; // Start at medium
  const factors: string[] = [];
  
  // High ATR = high volatility = higher risk
  if (indicators.atr > indicators.sma20 * 0.03) {
    riskScore += 2;
    factors.push('Yuksek volatilite (ATR)');
  }
  
  // Low volume = liquidity risk
  if (volumeRatio < 0.5) {
    riskScore += 2;
    factors.push('Dusuk likidite');
  }
  
  // Extreme RSI levels
  if (indicators.rsi > 80 || indicators.rsi < 20) {
    riskScore += 1;
    factors.push('Asiri RSI seviyeleri');
  }
  
  // Large daily move
  if (Math.abs(dayChangePercent) > 5) {
    riskScore += 2;
    factors.push('Buyuk gunluk hareket');
  }
  
  // Wide Bollinger bands = high uncertainty
  const bbWidth = (indicators.bollingerBands.upper - indicators.bollingerBands.lower) / indicators.bollingerBands.middle;
  if (bbWidth > 0.1) {
    riskScore += 1;
    factors.push('Genis Bollinger Bandlari');
  }
  
  // Positive factors (reduce risk)
  if (indicators.adx > 25) {
    riskScore -= 1;
    factors.push('Guclu trend (ADX)');
  }
  
  if (volumeRatio > 1.5) {
    riskScore -= 1;
    factors.push('Yuksek hacim');
  }
  
  // Clamp to 1-10
  riskScore = Math.max(1, Math.min(10, riskScore));
  
  let level: 'low' | 'medium' | 'high' = 'medium';
  if (riskScore <= 3) level = 'low';
  else if (riskScore >= 7) level = 'high';
  
  return { score: riskScore, level, factors };
}

/**
 * Main scoring function - generates complete ScanResult
 */
export function generateScanResult(input: ScoreInput): ScanResult {
  // Analyze signals
  const signals = analyzeSignals(
    input.indicators,
    input.currentPrice,
    input.dayChangePercent,
    input.fiftyTwoWeekLow
  );
  
  // Add volume-based signals with actual current volume
  const volumeRatio = input.indicators.volumeSMA20 > 0 
    ? input.currentVolume / input.indicators.volumeSMA20 
    : 1;
  
  // Re-analyze volume with actual ratio
  if (volumeRatio >= 2) {
    const existingVolSignal = signals.find(s => s.category === 'volume' && s.type === 'buy');
    if (!existingVolSignal) {
      signals.push({
        type: 'buy',
        category: 'volume',
        name: 'Cok Yuksek Hacim',
        description: `Hacim 20 gunluk ortalamanin ${volumeRatio.toFixed(1)}x kati`,
        points: SIGNAL_POINTS.VOLUME_HIGH_2X,
      });
    }
  } else if (volumeRatio >= 1.5) {
    const existingVolSignal = signals.find(s => s.category === 'volume' && s.type === 'buy');
    if (!existingVolSignal) {
      signals.push({
        type: 'buy',
        category: 'volume',
        name: 'Yuksek Hacim',
        description: `Hacim 20 gunluk ortalamanin ${volumeRatio.toFixed(1)}x kati`,
        points: SIGNAL_POINTS.VOLUME_HIGH_1_5X,
      });
    }
  } else if (volumeRatio < 0.5) {
    const existingVolSignal = signals.find(s => s.category === 'volume' && s.type === 'sell');
    if (!existingVolSignal) {
      signals.push({
        type: 'sell',
        category: 'volume',
        name: 'Dusuk Hacim',
        description: `Hacim normalin %${(volumeRatio * 100).toFixed(0)}'i - likidite riski`,
        points: SIGNAL_POINTS.VOLUME_LOW,
      });
    }
  }
  
  // Count signals
  const signalCounts = countSignals(signals);
  
  // Calculate scores
  const totalPoints = calculateTotalScore(signals);
  const confluenceBonus = calculateConfluenceBonus(signals);
  const finalPoints = totalPoints + confluenceBonus;
  
  // Calculate confidence (0-100%)
  // Base it on positive points relative to max possible
  const maxPossible = MAX_BUY_POINTS;
  const confidencePercent = Math.max(0, Math.min(100, 
    Math.round((finalPoints / maxPossible) * 100 + 20) // +20 base confidence
  ));
  
  // Calculate targets
  const target = calculateTargetPrice(input.currentPrice, input.indicators);
  const stopLoss = calculateStopLoss(input.currentPrice, input.indicators);
  
  // Risk-reward ratio
  const potentialGain = target.targetPrice - input.currentPrice;
  const potentialLoss = input.currentPrice - stopLoss.stopLoss;
  const riskRewardRatio = potentialLoss > 0 ? potentialGain / potentialLoss : 0;
  
  // Risk assessment
  const risk = calculateRiskScore(input.indicators, input.dayChangePercent, volumeRatio);
  
  return {
    symbol: input.symbol,
    name: input.name,
    sector: findSector(input.symbol),
    currentPrice: input.currentPrice,
    previousClose: input.previousClose,
    dayChange: input.dayChange,
    dayChangePercent: input.dayChangePercent,
    volume: input.volume,
    dayHigh: input.dayHigh,
    dayLow: input.dayLow,
    fiftyTwoWeekHigh: input.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: input.fiftyTwoWeekLow,
    
    indicators: input.indicators,
    signals,
    
    score: {
      totalPoints: finalPoints,
      maxPossiblePoints: maxPossible,
      confidencePercent,
      buySignalCount: signalCounts.buy,
      sellSignalCount: signalCounts.sell,
      confluenceBonus,
    },
    
    target: {
      targetPrice: target.targetPrice,
      expectedGainPercent: target.expectedGainPercent,
      stopLoss: stopLoss.stopLoss,
      stopLossPercent: stopLoss.stopLossPercent,
      riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    },
    
    risk,
    
    lastUpdated: new Date(),
  };
}

/**
 * Sort scan results by score
 */
export function sortScanResults(results: ScanResult[]): ScanResult[] {
  return results.sort((a, b) => {
    // Primary: confidence percent
    const confDiff = b.score.confidencePercent - a.score.confidencePercent;
    if (confDiff !== 0) return confDiff;
    
    // Secondary: buy signal count
    const buyDiff = b.score.buySignalCount - a.score.buySignalCount;
    if (buyDiff !== 0) return buyDiff;
    
    // Tertiary: risk-reward ratio
    return b.target.riskRewardRatio - a.target.riskRewardRatio;
  });
}

/**
 * Filter results for minimum quality
 */
export function filterQualityResults(results: ScanResult[]): ScanResult[] {
  return results.filter(r => {
    // Minimum confidence
    if (r.score.confidencePercent < 50) return false;
    
    // Must have at least 2 buy signals
    if (r.score.buySignalCount < 2) return false;
    
    // Sell signals should not outweigh buy signals
    if (r.score.sellSignalCount >= r.score.buySignalCount) return false;
    
    // Not extreme daily loss
    if (r.dayChangePercent < -5) return false;
    
    // Not extreme risk
    if (r.risk.score >= 9) return false;
    
    return true;
  });
}
