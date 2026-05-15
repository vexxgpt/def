// Technical Indicators Calculation Module
// Calculates RSI, MACD, Bollinger Bands, EMA, SMA, ATR, Stochastic, ADX, OBV

import type { HistoricalBar, TechnicalIndicators } from './scanner-types';

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (data.length < period) return calculateSMA(data, data.length);
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(data.slice(0, period), period);
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(closePrices: number[], period: number = 14): { current: number; previous: number } {
  if (closePrices.length < period + 1) {
    return { current: 50, previous: 50 };
  }
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const calculateRSIAtIndex = (endIndex: number): number => {
    if (endIndex < period) return 50;
    
    let avgGain = gains.slice(endIndex - period, endIndex).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(endIndex - period, endIndex).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    if (avgGain === 0) return 0;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };
  
  return {
    current: calculateRSIAtIndex(gains.length),
    previous: calculateRSIAtIndex(gains.length - 1),
  };
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
  closePrices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: number; signalLine: number; histogram: number; histogramPrev: number } {
  if (closePrices.length < slowPeriod + signalPeriod) {
    return { macdLine: 0, signalLine: 0, histogram: 0, histogramPrev: 0 };
  }
  
  // Calculate MACD line values over time
  const macdValues: number[] = [];
  for (let i = slowPeriod; i <= closePrices.length; i++) {
    const slice = closePrices.slice(0, i);
    const fastEMA = calculateEMA(slice, fastPeriod);
    const slowEMA = calculateEMA(slice, slowPeriod);
    macdValues.push(fastEMA - slowEMA);
  }
  
  const macdLine = macdValues[macdValues.length - 1] || 0;
  const signalLine = calculateEMA(macdValues, signalPeriod);
  const histogram = macdLine - signalLine;
  
  // Previous histogram
  const prevMacdLine = macdValues[macdValues.length - 2] || 0;
  const prevMacdValues = macdValues.slice(0, -1);
  const prevSignalLine = prevMacdValues.length >= signalPeriod 
    ? calculateEMA(prevMacdValues, signalPeriod) 
    : prevMacdLine;
  const histogramPrev = prevMacdLine - prevSignalLine;
  
  return { macdLine, signalLine, histogram, histogramPrev };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
  closePrices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number; middle: number; lower: number; percentB: number } {
  if (closePrices.length < period) {
    const currentPrice = closePrices[closePrices.length - 1] || 0;
    return { upper: currentPrice, middle: currentPrice, lower: currentPrice, percentB: 50 };
  }
  
  const slice = closePrices.slice(-period);
  const middle = slice.reduce((sum, val) => sum + val, 0) / period;
  
  // Calculate standard deviation
  const squaredDiffs = slice.map(val => Math.pow(val - middle, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = middle + (stdDev * stdDevMultiplier);
  const lower = middle - (stdDev * stdDevMultiplier);
  
  // Calculate %B (position within bands)
  const currentPrice = closePrices[closePrices.length - 1];
  const bandWidth = upper - lower;
  const percentB = bandWidth > 0 ? ((currentPrice - lower) / bandWidth) * 100 : 50;
  
  return { upper, middle, lower, percentB: Math.max(0, Math.min(100, percentB)) };
}

/**
 * Calculate ATR (Average True Range)
 */
export function calculateATR(bars: HistoricalBar[], period: number = 14): number {
  if (bars.length < 2) return 0;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  if (trueRanges.length < period) {
    return trueRanges.reduce((sum, val) => sum + val, 0) / trueRanges.length;
  }
  
  return trueRanges.slice(-period).reduce((sum, val) => sum + val, 0) / period;
}

/**
 * Calculate Stochastic Oscillator
 */
export function calculateStochastic(
  bars: HistoricalBar[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number; d: number; kPrev: number } {
  if (bars.length < kPeriod) {
    return { k: 50, d: 50, kPrev: 50 };
  }
  
  const calculateK = (endIndex: number): number => {
    const slice = bars.slice(Math.max(0, endIndex - kPeriod), endIndex);
    if (slice.length === 0) return 50;
    
    const highest = Math.max(...slice.map(b => b.high));
    const lowest = Math.min(...slice.map(b => b.low));
    const currentClose = slice[slice.length - 1].close;
    
    if (highest === lowest) return 50;
    return ((currentClose - lowest) / (highest - lowest)) * 100;
  };
  
  const kValues: number[] = [];
  for (let i = kPeriod; i <= bars.length; i++) {
    kValues.push(calculateK(i));
  }
  
  const k = kValues[kValues.length - 1] || 50;
  const kPrev = kValues[kValues.length - 2] || k;
  const d = kValues.length >= dPeriod 
    ? kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / dPeriod 
    : k;
  
  return { k, d, kPrev };
}

/**
 * Calculate ADX (Average Directional Index)
 */
export function calculateADX(bars: HistoricalBar[], period: number = 14): number {
  if (bars.length < period + 1) return 25;
  
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevHigh = bars[i - 1].high;
    const prevLow = bars[i - 1].low;
    const prevClose = bars[i - 1].close;
    
    // True Range
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    
    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  // Smoothed values
  const smoothedTR = calculateEMA(tr, period);
  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  
  if (smoothedTR === 0) return 25;
  
  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;
  
  const diSum = plusDI + minusDI;
  if (diSum === 0) return 25;
  
  const dx = (Math.abs(plusDI - minusDI) / diSum) * 100;
  
  return Math.min(100, Math.max(0, dx));
}

/**
 * Calculate OBV (On-Balance Volume)
 */
export function calculateOBV(bars: HistoricalBar[]): { obv: number; trend: 'rising' | 'falling' | 'neutral' } {
  if (bars.length < 2) return { obv: 0, trend: 'neutral' };
  
  let obv = 0;
  const obvValues: number[] = [0];
  
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].close > bars[i - 1].close) {
      obv += bars[i].volume;
    } else if (bars[i].close < bars[i - 1].close) {
      obv -= bars[i].volume;
    }
    obvValues.push(obv);
  }
  
  // Determine trend over last 5 days
  const recentOBV = obvValues.slice(-5);
  if (recentOBV.length < 2) return { obv, trend: 'neutral' };
  
  const obvChange = recentOBV[recentOBV.length - 1] - recentOBV[0];
  const avgVolume = bars.slice(-5).reduce((sum, b) => sum + b.volume, 0) / 5;
  const threshold = avgVolume * 0.5;
  
  let trend: 'rising' | 'falling' | 'neutral' = 'neutral';
  if (obvChange > threshold) trend = 'rising';
  else if (obvChange < -threshold) trend = 'falling';
  
  return { obv, trend };
}

/**
 * Calculate 3-day price change
 */
export function calculate3DayPriceChange(bars: HistoricalBar[]): number {
  if (bars.length < 4) return 0;
  
  const recent = bars.slice(-4);
  let consecutiveUp = 0;
  let consecutiveDown = 0;
  
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].close > recent[i - 1].close) {
      consecutiveUp++;
      consecutiveDown = 0;
    } else if (recent[i].close < recent[i - 1].close) {
      consecutiveDown++;
      consecutiveUp = 0;
    }
  }
  
  if (consecutiveUp >= 3) return consecutiveUp;
  if (consecutiveDown >= 3) return -consecutiveDown;
  return 0;
}

/**
 * Calculate average daily move over last 5 days
 */
export function calculateAvgDailyMove(bars: HistoricalBar[]): number {
  if (bars.length < 6) return 0;
  
  const recent = bars.slice(-6);
  let totalMove = 0;
  
  for (let i = 1; i < recent.length; i++) {
    const move = Math.abs(recent[i].close - recent[i - 1].close);
    totalMove += move;
  }
  
  return totalMove / 5;
}

/**
 * Calculate all technical indicators from historical data
 */
export function calculateAllIndicators(bars: HistoricalBar[]): TechnicalIndicators {
  const closePrices = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);
  
  const rsi = calculateRSI(closePrices, 14);
  const macd = calculateMACD(closePrices, 12, 26, 9);
  const bb = calculateBollingerBands(closePrices, 20, 2);
  const stoch = calculateStochastic(bars, 14, 3);
  const obv = calculateOBV(bars);
  
  return {
    rsi: rsi.current,
    rsiPrev: rsi.previous,
    macd: {
      macdLine: macd.macdLine,
      signalLine: macd.signalLine,
      histogram: macd.histogram,
      histogramPrev: macd.histogramPrev,
    },
    bollingerBands: {
      upper: bb.upper,
      middle: bb.middle,
      lower: bb.lower,
      percentB: bb.percentB,
    },
    ema: {
      ema9: calculateEMA(closePrices, 9),
      ema21: calculateEMA(closePrices, 21),
      ema50: calculateEMA(closePrices, 50),
    },
    sma20: calculateSMA(closePrices, 20),
    atr: calculateATR(bars, 14),
    volumeSMA20: calculateSMA(volumes, 20),
    stochastic: {
      k: stoch.k,
      d: stoch.d,
      kPrev: stoch.kPrev,
    },
    adx: calculateADX(bars, 14),
    obv: obv.obv,
    obvTrend: obv.trend,
    priceChange3Days: calculate3DayPriceChange(bars),
    avgDailyMove5Days: calculateAvgDailyMove(bars),
  };
}
