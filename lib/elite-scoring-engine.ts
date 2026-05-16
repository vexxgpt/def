// Elite Risk & Scoring Engine
// Profesyonel Risk Yonetimi ve Puanlama Sistemi

import type { 
  EliteTechnicalIndicators, 
  EliteSignal, 
  EliteRiskAnalysis, 
  EliteTargetAnalysis,
  EliteScanResult,
  HistoricalBar,
  RISK_THRESHOLDS,
  POSITION_SIZING
} from './elite-scanner-types';
import { summarizeSignals } from './elite-signal-engine';
import { findSector } from './bist-stocks';
import { 
  analyzeMorningGreen, 
  analyzeGap, 
  detectMomentumSurge, 
  analyzeSmartMoney 
} from './morning-green-analyzer';

const RISK_LIMITS = {
  MAX_VOLATILITY_ATR_PERCENT: 5,
  MIN_VOLUME_RATIO: 0.5,
  MIN_LIQUIDITY_VALUE: 500000, // 500K TL min gunluk hacim
  MAX_SPREAD_PERCENT: 1,
  MAX_DAILY_MOVE: 10,
  OVERBOUGHT_RSI: 75,
  OVERSOLD_RSI: 25,
} as const;

const POSITION_LIMITS = {
  MAX_SINGLE_POSITION_PERCENT: 10,
  MIN_RISK_REWARD_RATIO: 1.5,
  MAX_PORTFOLIO_RISK_PERCENT: 2,
  KELLY_MULTIPLIER: 0.5,
} as const;

// ==========================================
// RISK ANALIZI
// ==========================================

export function calculateEliteRiskAnalysis(
  indicators: EliteTechnicalIndicators,
  currentPrice: number,
  dayChangePercent: number,
  volume: number,
  signals: EliteSignal[]
): EliteRiskAnalysis {
  const warnings: string[] = [];
  const dealBreakers: string[] = [];
  
  // === VOLATILITE RISKI ===
  let volatilityRisk = 30; // Baz risk
  
  if (indicators.atr.percent > RISK_LIMITS.MAX_VOLATILITY_ATR_PERCENT) {
    volatilityRisk += 30;
    warnings.push(`Cok yuksek volatilite: ATR %${indicators.atr.percent.toFixed(2)}`);
  } else if (indicators.atr.percent > 3) {
    volatilityRisk += 15;
    warnings.push(`Yuksek volatilite: ATR %${indicators.atr.percent.toFixed(2)}`);
  } else if (indicators.atr.percent < 1) {
    volatilityRisk -= 10;
  }
  
  if (indicators.bollingerBands.bandwidth > 15) {
    volatilityRisk += 15;
    warnings.push('Bollinger Bandlari cok genis - belirsizlik yuksek');
  }
  
  if (Math.abs(dayChangePercent) > RISK_LIMITS.MAX_DAILY_MOVE) {
    volatilityRisk += 25;
    dealBreakers.push(`ASIRI HAREKET: Bugun %${Math.abs(dayChangePercent).toFixed(2)} - cok riskli!`);
  } else if (Math.abs(dayChangePercent) > 5) {
    volatilityRisk += 15;
    warnings.push(`Buyuk gunluk hareket: %${dayChangePercent.toFixed(2)}`);
  }
  
  // === LIKIDITE RISKI ===
  let liquidityRisk = 20;
  
  const dailyValue = volume * currentPrice;
  if (dailyValue < RISK_LIMITS.MIN_LIQUIDITY_VALUE) {
    liquidityRisk += 40;
    dealBreakers.push(`LIKIDITE UYARISI: Gunluk islem hacmi ${(dailyValue / 1000000).toFixed(2)}M TL - 1M TL pozisyon icin yetersiz!`);
  } else if (dailyValue < 1000000) {
    liquidityRisk += 25;
    warnings.push(`Dusuk likidite: ${(dailyValue / 1000000).toFixed(2)}M TL gunluk hacim`);
  } else if (dailyValue < 5000000) {
    liquidityRisk += 10;
  }
  
  if (indicators.volume.ratio < RISK_LIMITS.MIN_VOLUME_RATIO) {
    liquidityRisk += 20;
    warnings.push(`Hacim ortalamanin %${(indicators.volume.ratio * 100).toFixed(0)}'i`);
  }
  
  // === TREND RISKI ===
  let trendRisk = 30;
  
  if (indicators.adx.trend === 'weak') {
    trendRisk += 15;
    warnings.push('Zayif trend - yon belirsiz');
  } else if (indicators.adx.trend === 'strong_down' || indicators.adx.trend === 'down') {
    trendRisk += 25;
    warnings.push('Asagi trend - yukselise karsi islem!');
  } else if (indicators.adx.trend === 'strong_up' || indicators.adx.trend === 'up') {
    trendRisk -= 15;
  }
  
  if (indicators.ema.alignment === 'perfect_bearish' || indicators.ema.alignment === 'bearish') {
    trendRisk += 20;
    warnings.push('EMA\'lar asagi sirali - trend aleyhte');
  } else if (indicators.ema.alignment === 'perfect_bullish') {
    trendRisk -= 20;
  }
  
  if (indicators.dailyTrend === 'down' && indicators.weeklyTrend === 'down') {
    trendRisk += 20;
    dealBreakers.push('TREND ALEYHTE: Hem gunluk hem haftalik trend asagi!');
  }
  
  // === ASIRI UZANMA RISKI ===
  let overextensionRisk = 20;
  
  if (indicators.rsi.current > RISK_LIMITS.OVERBOUGHT_RSI) {
    overextensionRisk += 30;
    warnings.push(`RSI asiri alim: ${indicators.rsi.current.toFixed(0)}`);
  } else if (indicators.rsi.current > 65) {
    overextensionRisk += 10;
  }
  
  if (indicators.stochastic.k > 80) {
    overextensionRisk += 15;
  }
  
  if (indicators.bollingerBands.percentB > 90) {
    overextensionRisk += 20;
    warnings.push('Fiyat Bollinger ust bandinda - geri cekilme riski');
  }
  
  if (indicators.pricePosition.distanceFrom52High < 3) {
    overextensionRisk += 20;
    warnings.push('52 hafta en yuksege cok yakin - direnç');
  }
  
  // Diverjans kontrol
  if (indicators.rsi.divergence === 'bearish' || indicators.macd.divergence === 'bearish') {
    overextensionRisk += 25;
    dealBreakers.push('BEARISH DIVERJANS: Fiyat yuksek ama momentum dusuyor!');
  }
  
  // === NEWS RISKI (Proxy) ===
  // Gercek haber verisi olmadan, ani hacim ve fiyat degisikliklerine bakiyoruz
  let newsRisk = 10;
  
  if (indicators.volume.ratio > 3 && Math.abs(dayChangePercent) > 5) {
    newsRisk += 30;
    warnings.push('Olagan disi hareket - haber kontrolu yapilmali');
  }
  
  // === TOPLAM RISK SKORU ===
  const weights = {
    volatility: 0.25,
    liquidity: 0.30, // Likidite 1M TL icin cok onemli
    trend: 0.20,
    overextension: 0.15,
    news: 0.10,
  };
  
  const totalRisk = Math.round(
    volatilityRisk * weights.volatility +
    liquidityRisk * weights.liquidity +
    trendRisk * weights.trend +
    overextensionRisk * weights.overextension +
    newsRisk * weights.news
  );
  
  // Risk seviyesi
  let level: EliteRiskAnalysis['level'];
  if (totalRisk >= 80) level = 'extreme';
  else if (totalRisk >= 65) level = 'very_high';
  else if (totalRisk >= 50) level = 'high';
  else if (totalRisk >= 35) level = 'medium';
  else if (totalRisk >= 20) level = 'low';
  else level = 'very_low';
  
  // === POZISYON BOYUTLANDIRMA ===
  
  // Kelly Criterion (basitlestirilmis)
  const signalSummary = summarizeSignals(signals);
  const totalBuySignals = signalSummary.strongBuyCount + signalSummary.buyCount;
  const totalSellSignals = signalSummary.strongSellCount + signalSummary.sellCount;
  const winProbability = totalBuySignals / Math.max(1, totalBuySignals + totalSellSignals);
  const avgWinLoss = 1.5; // Ortalama 1.5:1 risk/odul varsayimi
  
  const kellyRaw = winProbability - ((1 - winProbability) / avgWinLoss);
  const kellyPercentage = Math.max(0, Math.min(25, kellyRaw * 100 * POSITION_LIMITS.KELLY_MULTIPLIER));
  
  // Risk bazli pozisyon boyutu
  let recommendedPositionSize: number;
  let maxPositionSize: number;
  
  if (dealBreakers.length > 0) {
    recommendedPositionSize = 0;
    maxPositionSize = 0;
  } else if (level === 'extreme' || level === 'very_high') {
    recommendedPositionSize = Math.min(2, kellyPercentage);
    maxPositionSize = 3;
  } else if (level === 'high') {
    recommendedPositionSize = Math.min(4, kellyPercentage);
    maxPositionSize = 5;
  } else if (level === 'medium') {
    recommendedPositionSize = Math.min(6, kellyPercentage);
    maxPositionSize = 8;
  } else {
    recommendedPositionSize = Math.min(8, kellyPercentage);
    maxPositionSize = 10;
  }
  
  // === STOP LOSS SEVIYELERI ===
  const atr = indicators.atr.value;
  
  const stopLossLevels = {
    tight: {
      price: Math.round((currentPrice - atr * 1) * 100) / 100,
      percent: Math.round((atr / currentPrice) * 100 * 10) / 10,
    },
    normal: {
      price: Math.round((currentPrice - atr * 1.5) * 100) / 100,
      percent: Math.round((atr * 1.5 / currentPrice) * 100 * 10) / 10,
    },
    wide: {
      price: Math.round((currentPrice - atr * 2.5) * 100) / 100,
      percent: Math.round((atr * 2.5 / currentPrice) * 100 * 10) / 10,
    },
  };
  
  // Support bazli stop (varsa daha iyi)
  const supportStop = indicators.pivotPoints.s1;
  if (supportStop < currentPrice && supportStop > stopLossLevels.tight.price) {
    stopLossLevels.tight.price = Math.round((supportStop * 0.995) * 100) / 100;
    stopLossLevels.tight.percent = Math.round(((currentPrice - stopLossLevels.tight.price) / currentPrice) * 100 * 10) / 10;
  }
  
  return {
    score: totalRisk,
    level,
    factors: {
      volatilityRisk: Math.min(100, volatilityRisk),
      liquidityRisk: Math.min(100, liquidityRisk),
      trendRisk: Math.min(100, trendRisk),
      overextensionRisk: Math.min(100, overextensionRisk),
      newsRisk: Math.min(100, newsRisk),
    },
    warnings,
    dealBreakers,
    recommendedPositionSize,
    maxPositionSize,
    kellyPercentage: Math.round(kellyPercentage * 10) / 10,
    stopLossLevels,
  };
}

// ==========================================
// HEDEF ANALIZI
// ==========================================

export function calculateEliteTargetAnalysis(
  indicators: EliteTechnicalIndicators,
  currentPrice: number,
  risk: EliteRiskAnalysis
): EliteTargetAnalysis {
  const atr = indicators.atr.value;
  
  // Teknik hedefler
  const technicalTargets = {
    pivotR1: indicators.pivotPoints.r1,
    bollingerMiddle: indicators.bollingerBands.middle,
    bollingerUpper: indicators.bollingerBands.upper,
    atrTarget: currentPrice + atr,
    fibTarget382: indicators.fibonacciLevels.level382,
    fibTarget618: indicators.fibonacciLevels.level618,
  };
  
  // Hedef fiyatlar hesaplama
  const targets = {
    conservative: {
      price: 0,
      percent: 0,
      probability: 0,
    },
    moderate: {
      price: 0,
      percent: 0,
      probability: 0,
    },
    aggressive: {
      price: 0,
      percent: 0,
      probability: 0,
    },
  };
  
  // Conservative: Minimum %1 veya ATR'nin %30'u
  const conservativeGain = Math.max(currentPrice * 0.01, atr * 0.3);
  targets.conservative.price = Math.round((currentPrice + conservativeGain) * 100) / 100;
  targets.conservative.percent = Math.round((conservativeGain / currentPrice) * 100 * 100) / 100;
  targets.conservative.probability = Math.min(85, 90 - risk.score / 2);
  
  // Moderate: ATR'nin %50-70'i veya BB middle
  const moderateGain = Math.max(atr * 0.5, (technicalTargets.bollingerMiddle - currentPrice) * 0.5);
  targets.moderate.price = Math.round((currentPrice + Math.max(moderateGain, conservativeGain * 1.5)) * 100) / 100;
  targets.moderate.percent = Math.round(((targets.moderate.price - currentPrice) / currentPrice) * 100 * 100) / 100;
  targets.moderate.probability = Math.min(70, 75 - risk.score / 2);
  
  // Aggressive: ATR veya R1
  const aggressiveGain = Math.max(atr, technicalTargets.pivotR1 - currentPrice);
  targets.aggressive.price = Math.round((currentPrice + Math.max(aggressiveGain, moderateGain * 1.5)) * 100) / 100;
  targets.aggressive.percent = Math.round(((targets.aggressive.price - currentPrice) / currentPrice) * 100 * 100) / 100;
  targets.aggressive.probability = Math.min(50, 55 - risk.score / 2);
  
  // Risk/Reward oranlari
  const normalStopLoss = risk.stopLossLevels.normal.price;
  const riskAmount = currentPrice - normalStopLoss;
  
  const riskRewardRatios = {
    conservative: riskAmount > 0 ? Math.round((targets.conservative.price - currentPrice) / riskAmount * 100) / 100 : 0,
    moderate: riskAmount > 0 ? Math.round((targets.moderate.price - currentPrice) / riskAmount * 100) / 100 : 0,
    aggressive: riskAmount > 0 ? Math.round((targets.aggressive.price - currentPrice) / riskAmount * 100) / 100 : 0,
  };
  
  // Zaman tahmini
  let expectedTimeframe: EliteTargetAnalysis['expectedTimeframe'];
  if (indicators.adx.value > 40) {
    expectedTimeframe = 'intraday';
  } else if (indicators.adx.value > 30) {
    expectedTimeframe = '1-3_days';
  } else if (indicators.adx.value > 20) {
    expectedTimeframe = '1_week';
  } else {
    expectedTimeframe = '2_weeks';
  }
  
  return {
    targets,
    technicalTargets,
    riskRewardRatios,
    expectedTimeframe,
  };
}

// ==========================================
// SKOR HESAPLAMA
// ==========================================

export function calculateEliteScore(
  indicators: EliteTechnicalIndicators,
  signals: EliteSignal[],
  risk: EliteRiskAnalysis
): {
  technical: number;
  momentum: number;
  trend: number;
  volume: number;
  pattern: number;
  overall: number;
  confidence: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
} {
  // Kategori bazli skor
  const categoryScores: Record<string, number[]> = {
    momentum: [],
    trend: [],
    volume: [],
    pattern: [],
    other: [],
  };
  
  for (const signal of signals) {
    const normalizedScore = Math.max(-100, Math.min(100, signal.points * (signal.weight / 5)));
    
    switch (signal.category) {
      case 'momentum':
        categoryScores.momentum.push(normalizedScore);
        break;
      case 'trend':
      case 'ichimoku':
      case 'multi_timeframe':
        categoryScores.trend.push(normalizedScore);
        break;
      case 'volume':
        categoryScores.volume.push(normalizedScore);
        break;
      case 'pattern':
        categoryScores.pattern.push(normalizedScore);
        break;
      default:
        categoryScores.other.push(normalizedScore);
    }
  }
  
  const calcCategoryScore = (scores: number[]): number => {
    if (scores.length === 0) return 50;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.max(0, Math.min(100, 50 + sum / 2));
  };
  
  const momentum = calcCategoryScore(categoryScores.momentum);
  const trend = calcCategoryScore(categoryScores.trend);
  const volume = calcCategoryScore(categoryScores.volume);
  const pattern = calcCategoryScore(categoryScores.pattern);
  
  // Teknik skor (agirlikli ortalama)
  const technical = Math.round(
    momentum * 0.30 +
    trend * 0.35 +
    volume * 0.20 +
    pattern * 0.15
  );
  
  // Overall skor (risk dahil)
  const riskPenalty = risk.score / 2; // Risk skoru ne kadar yuksekse o kadar ceza
  const overall = Math.max(0, Math.min(100, Math.round(technical - riskPenalty)));
  
  // Deal breaker kontrolu
  let finalOverall = overall;
  if (risk.dealBreakers.length > 0) {
    finalOverall = Math.min(25, overall); // Deal breaker varsa max 25 puan
  }
  
  // Guven yuzdesi
  const signalSummary = summarizeSignals(signals);
  const totalSignals = signalSummary.strongBuyCount + signalSummary.buyCount + 
                       signalSummary.neutralCount + signalSummary.sellCount + signalSummary.strongSellCount;
  const positiveSignals = signalSummary.strongBuyCount * 2 + signalSummary.buyCount;
  const negativeSignals = signalSummary.strongSellCount * 2 + signalSummary.sellCount;
  
  let confidence = 50;
  if (totalSignals > 0) {
    confidence = Math.round((positiveSignals / (positiveSignals + negativeSignals + 1)) * 100);
  }
  
  // Risk'e gore guven dusur
  confidence = Math.max(0, Math.min(100, confidence - risk.score / 3));
  
  if (risk.dealBreakers.length > 0) {
    confidence = Math.min(20, confidence);
  }
  
  // Grade
  let grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  if (finalOverall >= 85 && confidence >= 75) grade = 'A+';
  else if (finalOverall >= 75 && confidence >= 65) grade = 'A';
  else if (finalOverall >= 65 && confidence >= 55) grade = 'B+';
  else if (finalOverall >= 55 && confidence >= 45) grade = 'B';
  else if (finalOverall >= 45 && confidence >= 35) grade = 'C+';
  else if (finalOverall >= 35) grade = 'C';
  else if (finalOverall >= 25) grade = 'D';
  else grade = 'F';
  
  return {
    technical,
    momentum,
    trend,
    volume,
    pattern,
    overall: finalOverall,
    confidence,
    grade,
  };
}

// ==========================================
// KARAR MOTORU - ULTRA-PRO VERSIYON
// ==========================================

export function generateDecision(
  score: ReturnType<typeof calculateEliteScore>,
  risk: EliteRiskAnalysis,
  target: EliteTargetAnalysis,
  signals: EliteSignal[]
): {
  action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'SELL';
  reasoning: string[];
  conviction: number;
  proAnalysis: {
    confluenceScore: number;
    trendAlignment: number;
    momentumQuality: number;
    riskAdjustedReturn: number;
    institutionalSignal: 'strong' | 'moderate' | 'weak' | 'none';
    marketTiming: 'optimal' | 'good' | 'neutral' | 'poor';
    entryQuality: 'A' | 'B' | 'C' | 'D' | 'F';
  };
} {
  const reasoning: string[] = [];
  let conviction = score.confidence;
  
  // === PRO ANALIZ HESAPLAMALARI ===
  const signalSummary = summarizeSignals(signals);
  
  // Confluence Score (farkli kategorilerden sinyal sayisi)
  const categoryStrengths: Record<string, number> = {};
  for (const signal of signals) {
    if (signal.type === 'strong_buy' || signal.type === 'buy') {
      categoryStrengths[signal.category] = (categoryStrengths[signal.category] || 0) + (signal.type === 'strong_buy' ? 2 : 1);
    }
  }
  const activeCategories = Object.keys(categoryStrengths).length;
  const confluenceScore = Math.min(100, activeCategories * 20 + Object.values(categoryStrengths).reduce((a, b) => a + b, 0) * 3);
  
  // Trend Alignment Score
  let trendAlignment = 50;
  if (categoryStrengths['trend']) trendAlignment += categoryStrengths['trend'] * 10;
  if (categoryStrengths['ichimoku']) trendAlignment += categoryStrengths['ichimoku'] * 8;
  if (categoryStrengths['multi_timeframe']) trendAlignment += categoryStrengths['multi_timeframe'] * 12;
  trendAlignment = Math.min(100, trendAlignment);
  
  // Momentum Quality Score
  let momentumQuality = 50;
  if (categoryStrengths['momentum']) momentumQuality += categoryStrengths['momentum'] * 8;
  if (categoryStrengths['volume']) momentumQuality += categoryStrengths['volume'] * 6;
  momentumQuality = Math.min(100, momentumQuality);
  
  // Risk Adjusted Return (Sharpe-like)
  const expectedReturn = target.targets.moderate.percent;
  const riskPenalty = risk.score * 0.5;
  const riskAdjustedReturn = Math.max(0, expectedReturn - riskPenalty);
  
  // Institutional Signal Detection
  let institutionalSignal: 'strong' | 'moderate' | 'weak' | 'none' = 'none';
  const volumeSignal = categoryStrengths['volume'] || 0;
  const strongBuyCount = signalSummary.strongBuyCount;
  if (volumeSignal >= 4 && strongBuyCount >= 3) institutionalSignal = 'strong';
  else if (volumeSignal >= 2 && strongBuyCount >= 2) institutionalSignal = 'moderate';
  else if (volumeSignal >= 1 || strongBuyCount >= 1) institutionalSignal = 'weak';
  
  // Market Timing Score
  let marketTiming: 'optimal' | 'good' | 'neutral' | 'poor' = 'neutral';
  const totalBuySignals = signalSummary.strongBuyCount + signalSummary.buyCount;
  const totalSellSignals = signalSummary.strongSellCount + signalSummary.sellCount;
  const netSignal = totalBuySignals - totalSellSignals;
  if (netSignal >= 8 && confluenceScore >= 70) marketTiming = 'optimal';
  else if (netSignal >= 5 && confluenceScore >= 50) marketTiming = 'good';
  else if (netSignal <= -3) marketTiming = 'poor';
  
  // Entry Quality Grade
  let entryQuality: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  const combinedScore = (confluenceScore + trendAlignment + momentumQuality) / 3;
  if (combinedScore >= 80 && risk.level === 'very_low') entryQuality = 'A';
  else if (combinedScore >= 70 && (risk.level === 'very_low' || risk.level === 'low')) entryQuality = 'B';
  else if (combinedScore >= 55 && risk.level !== 'extreme' && risk.level !== 'very_high') entryQuality = 'C';
  else if (combinedScore >= 40) entryQuality = 'D';
  else entryQuality = 'F';
  
  const proAnalysis = {
    confluenceScore,
    trendAlignment,
    momentumQuality,
    riskAdjustedReturn,
    institutionalSignal,
    marketTiming,
    entryQuality,
  };
  
  // === KARAR MANTIGI ===
  
  // Deal breaker kontrolu
  if (risk.dealBreakers.length > 0) {
    return {
      action: 'AVOID',
      reasoning: [
        'KRITIK UYARI: Bu hisseyi ALMAYIN!',
        ...risk.dealBreakers,
        'Risk cok yuksek - para kaybetme olasiligi yuksek.'
      ],
      conviction: 0,
      proAnalysis: { ...proAnalysis, entryQuality: 'F' },
    };
  }
  
  // Risk cok yuksekse
  if (risk.level === 'extreme' || risk.level === 'very_high') {
    return {
      action: 'AVOID',
      reasoning: [
        `Risk seviyesi: ${risk.level.toUpperCase()}`,
        ...risk.warnings.slice(0, 3),
        '1M TL pozisyon icin cok riskli.'
      ],
      conviction: Math.min(20, conviction),
      proAnalysis: { ...proAnalysis, entryQuality: 'F' },
    };
  }
  
  const netBuySignals = signalSummary.strongBuyCount + signalSummary.buyCount - 
                        signalSummary.strongSellCount - signalSummary.sellCount;
  
  // STRONG_BUY kriterleri - COK SIKI
  if (
    (score.grade === 'A+' || score.grade === 'A') &&
    (risk.level === 'low' || risk.level === 'very_low') &&
    target.riskRewardRatios.moderate >= 2 &&
    signalSummary.strongBuyCount >= 3 &&
    netBuySignals >= 7 &&
    confluenceScore >= 70 &&
    activeCategories >= 4 &&
    entryQuality === 'A'
  ) {
    reasoning.push(
      `MUKEMMEL FIRSAT! Grade: ${score.grade}`,
      `${signalSummary.strongBuyCount} GUCLU alim sinyali, ${activeCategories} farkli kategoride`,
      `Confluence Skoru: ${confluenceScore}/100`,
      `Risk/Odul: 1:${target.riskRewardRatios.moderate.toFixed(1)}`,
      `Kurumsal Sinyal: ${institutionalSignal.toUpperCase()}`,
      `Giris Kalitesi: ${entryQuality}`,
      'Tum profesyonel kriterler karsilandi!'
    );
    return {
      action: 'STRONG_BUY',
      reasoning,
      conviction: Math.min(98, conviction + 25),
      proAnalysis,
    };
  }
  
  // BUY kriterleri - SIKI
  if (
    (score.grade === 'A+' || score.grade === 'A' || score.grade === 'B+') &&
    (risk.level === 'low' || risk.level === 'very_low') &&
    target.riskRewardRatios.conservative >= 1.5 &&
    netBuySignals >= 5 &&
    confluenceScore >= 50 &&
    activeCategories >= 3 &&
    (entryQuality === 'A' || entryQuality === 'B')
  ) {
    reasoning.push(
      `Guvenilir Firsat! Grade: ${score.grade}`,
      `Net ${netBuySignals} alim sinyali, ${activeCategories} kategoride`,
      `Confluence Skoru: ${confluenceScore}/100`,
      `Risk/Odul: 1:${target.riskRewardRatios.conservative.toFixed(1)}`,
      `Giris Kalitesi: ${entryQuality}`
    );
    return {
      action: 'BUY',
      reasoning,
      conviction: Math.min(92, conviction + 15),
      proAnalysis,
    };
  }
  
  // SELL kriterleri
  if (
    signalSummary.strongSellCount >= 2 ||
    netBuySignals <= -3 ||
    (score.overall < 35 && signalSummary.sellCount > signalSummary.buyCount)
  ) {
    reasoning.push(
      'Satis baskisi mevcut.',
      `${signalSummary.strongSellCount + signalSummary.sellCount} satis sinyali`,
      'Pozisyon acmayin veya mevcut pozisyonlari degerlendirin.'
    );
    return {
      action: 'SELL',
      reasoning,
      conviction: Math.min(70, conviction),
      proAnalysis: { ...proAnalysis, entryQuality: 'F' },
    };
  }
  
  // HOLD - belirsiz durum
  reasoning.push(
    `Grade: ${score.grade}`,
    `Net sinyal: ${netBuySignals > 0 ? '+' : ''}${netBuySignals}`,
    `Confluence: ${confluenceScore}/100`,
    `Risk: ${risk.level}`,
    'Profesyonel kriterler karsilanmiyor - daha iyi firsatlari bekleyin.'
  );
  
  return {
    action: 'HOLD',
    reasoning,
    conviction: Math.min(50, conviction),
    proAnalysis,
  };
}

// ==========================================
// ANA SONUC URETICI
// ==========================================

interface EliteScanInput {
  symbol: string;
  name: string;
  currentPrice: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  indicators: EliteTechnicalIndicators;
  signals: EliteSignal[];
  bars?: HistoricalBar[]; // Tarihsel veri - sabah yesil analizi icin
}

export function generateEliteScanResult(input: EliteScanInput): EliteScanResult {
  const dayChange = input.currentPrice - input.previousClose;
  const dayChangePercent = (dayChange / input.previousClose) * 100;
  
  // Risk analizi
  const risk = calculateEliteRiskAnalysis(
    input.indicators,
    input.currentPrice,
    dayChangePercent,
    input.volume,
    input.signals
  );
  
  // Hedef analizi
  const target = calculateEliteTargetAnalysis(
    input.indicators,
    input.currentPrice,
    risk
  );
  
  // Skor
  const score = calculateEliteScore(input.indicators, input.signals, risk);
  
  // Sinyal ozeti
  const signalSummary = summarizeSignals(input.signals);
  
  // Karar
  const decision = generateDecision(score, risk, target, input.signals);
  
  // Veri kalitesi
  const dataQuality = input.indicators.volume.sma20 > 0 ? 
    (input.indicators.volume.ratio > 0.3 ? 'excellent' : 'good') : 'fair';
  
  // PRO ANALIZLER - SABAH YESIL YAKMA
  const bars = input.bars || [];
  const morningGreen = analyzeMorningGreen(bars, input.currentPrice);
  const gapAnalysis = analyzeGap(bars, input.currentPrice);
  const momentumSurge = detectMomentumSurge(bars, input.currentPrice, input.volume);
  const smartMoney = analyzeSmartMoney(bars, input.volume);
  
  return {
    symbol: input.symbol,
    name: input.name,
    sector: findSector(input.symbol),
    
    price: {
      current: input.currentPrice,
      open: input.open,
      high: input.high,
      low: input.low,
      previousClose: input.previousClose,
      change: dayChange,
      changePercent: dayChangePercent,
      fiftyTwoWeekHigh: input.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: input.fiftyTwoWeekLow,
    },
    
    volume: {
      current: input.volume,
      average20: input.indicators.volume.sma20,
      ratio: input.indicators.volume.ratio,
    },
    
    indicators: input.indicators,
    signals: input.signals,
    signalSummary,
    
    score,
    risk,
    target,
    decision,
    
    lastUpdated: new Date(),
    dataQuality,
    
    // PRO OZELLIKLER
    morningGreen,
    gapAnalysis,
    momentumSurge,
    smartMoney,
  };
}

// ==========================================
// SIRALAMA VE FILTRELEME
// ==========================================

export function sortEliteResults(results: EliteScanResult[]): EliteScanResult[] {
  return results.sort((a, b) => {
    // Deal breaker olanlari en sona at
    const aHasDealBreaker = a.risk.dealBreakers.length > 0;
    const bHasDealBreaker = b.risk.dealBreakers.length > 0;
    if (aHasDealBreaker !== bHasDealBreaker) {
      return aHasDealBreaker ? 1 : -1;
    }
    
    // Action'a gore sirala
    const actionOrder = { 'STRONG_BUY': 0, 'BUY': 1, 'HOLD': 2, 'SELL': 3, 'AVOID': 4 };
    const actionDiff = actionOrder[a.decision.action] - actionOrder[b.decision.action];
    if (actionDiff !== 0) return actionDiff;
    
    // Conviction'a gore sirala
    const convictionDiff = b.decision.conviction - a.decision.conviction;
    if (convictionDiff !== 0) return convictionDiff;
    
    // Overall skora gore sirala
    return b.score.overall - a.score.overall;
  });
}

// ==========================================
// PROFESYONEL SKORLAMA SISTEMI
// TradingView, Finviz, ThinkOrSwim tarzinda
// ==========================================

// Her hisse icin kompozit skor hesapla (0-100)
export function calculateCompositeScore(r: EliteScanResult): number {
  let score = 0;
  
  // 1. TEKNIK SKOR (max 25 puan)
  score += Math.min(25, r.score.technical * 0.25);
  
  // 2. MOMENTUM SKORU (max 20 puan)
  score += Math.min(20, r.score.momentum * 0.20);
  
  // 3. TREND SKORU (max 20 puan)
  score += Math.min(20, r.score.trend * 0.20);
  
  // 4. HACIM SKORU (max 15 puan)
  const volumeBonus = r.volume.ratio >= 2 ? 15 : r.volume.ratio >= 1.5 ? 12 : r.volume.ratio >= 1 ? 9 : r.volume.ratio * 9;
  score += volumeBonus;
  
  // 5. SINYAL GUCU (max 20 puan)
  const netSignals = r.signalSummary.strongBuyCount * 2 + r.signalSummary.buyCount - 
                     r.signalSummary.strongSellCount * 2 - r.signalSummary.sellCount;
  const signalScore = Math.max(0, Math.min(20, (netSignals + 5) * 2));
  score += signalScore;
  
  // BONUS PUANLAR
  // Bullish EMA alignment
  if (r.indicators.ema.alignment === 'perfect_bullish') score += 5;
  else if (r.indicators.ema.alignment === 'bullish') score += 3;
  
  // Guclu ADX trendi
  if (r.indicators.adx.trend === 'strong_up') score += 4;
  else if (r.indicators.adx.trend === 'up') score += 2;
  
  // Bullish MACD
  if (r.indicators.macd.histogram > 0 && r.indicators.macd.crossover === 'bullish') score += 4;
  
  // Ideal RSI bolgesi (40-60)
  if (r.indicators.rsi.current >= 40 && r.indicators.rsi.current <= 60) score += 3;
  
  // Bullish divergence bonus
  if (r.indicators.rsi.divergence === 'bullish' || r.indicators.macd.divergence === 'bullish') score += 5;
  
  // CEZA PUANLARI
  // Bearish divergence
  if (r.indicators.rsi.divergence === 'bearish' || r.indicators.macd.divergence === 'bearish') score -= 10;
  
  // Asiri alim/satim
  if (r.indicators.rsi.current > 75) score -= 8;
  if (r.indicators.rsi.current < 25) score -= 5;
  
  // Yuksek risk
  if (r.risk.level === 'extreme') score -= 20;
  else if (r.risk.level === 'very_high') score -= 12;
  else if (r.risk.level === 'high') score -= 6;
  
  // Deal breaker
  if (r.risk.dealBreakers.length > 0) score -= 25;
  
  return Math.max(0, Math.min(100, score));
}

// Sinyal Gucu Hesaplama (TradingView tarzinda)
export function calculateSignalStrength(r: EliteScanResult): {
  strength: number; // 0-100
  label: 'GUCLU AL' | 'AL' | 'NOTR' | 'SAT' | 'GUCLU SAT';
  oscillators: { buy: number; neutral: number; sell: number };
  movingAverages: { buy: number; neutral: number; sell: number };
  summary: { buy: number; neutral: number; sell: number };
} {
  // Osilatorler
  let oscBuy = 0, oscNeutral = 0, oscSell = 0;
  
  // RSI
  if (r.indicators.rsi.current < 30) oscBuy++;
  else if (r.indicators.rsi.current > 70) oscSell++;
  else oscNeutral++;
  
  // Stochastic
  if (r.indicators.stochastic.k < 20) oscBuy++;
  else if (r.indicators.stochastic.k > 80) oscSell++;
  else oscNeutral++;
  
  // CCI
  if (r.indicators.cci.current < -100) oscBuy++;
  else if (r.indicators.cci.current > 100) oscSell++;
  else oscNeutral++;
  
  // Williams %R
  if (r.indicators.williamsR.current < -80) oscBuy++;
  else if (r.indicators.williamsR.current > -20) oscSell++;
  else oscNeutral++;
  
  // MFI
  if (r.indicators.mfi.current < 20) oscBuy++;
  else if (r.indicators.mfi.current > 80) oscSell++;
  else oscNeutral++;
  
  // MACD
  if (r.indicators.macd.histogram > 0 && r.indicators.macd.crossover === 'bullish') oscBuy++;
  else if (r.indicators.macd.histogram < 0 && r.indicators.macd.crossover === 'bearish') oscSell++;
  else oscNeutral++;
  
  // ADX
  if (r.indicators.adx.plusDI > r.indicators.adx.minusDI && r.indicators.adx.current > 20) oscBuy++;
  else if (r.indicators.adx.minusDI > r.indicators.adx.plusDI && r.indicators.adx.current > 20) oscSell++;
  else oscNeutral++;
  
  // Hareketli Ortalamalar
  let maBuy = 0, maNeutral = 0, maSell = 0;
  const price = r.price.current;
  
  // EMA'lar
  if (price > r.indicators.ema.ema8) maBuy++; else maSell++;
  if (price > r.indicators.ema.ema21) maBuy++; else maSell++;
  if (price > r.indicators.ema.ema55) maBuy++; else maSell++;
  if (price > r.indicators.ema.ema200) maBuy++; else maSell++;
  
  // SMA'lar
  if (price > r.indicators.sma.sma20) maBuy++; else maSell++;
  if (price > r.indicators.sma.sma50) maBuy++; else maSell++;
  if (price > r.indicators.sma.sma100) maBuy++; else maSell++;
  if (price > r.indicators.sma.sma200) maBuy++; else maSell++;
  
  // Ichimoku
  if (r.indicators.ichimoku.cloudSignal === 'strong_bullish') maBuy += 2;
  else if (r.indicators.ichimoku.cloudSignal === 'bullish') maBuy++;
  else if (r.indicators.ichimoku.cloudSignal === 'strong_bearish') maSell += 2;
  else if (r.indicators.ichimoku.cloudSignal === 'bearish') maSell++;
  else maNeutral++;
  
  // Toplam
  const totalBuy = oscBuy + maBuy;
  const totalNeutral = oscNeutral + maNeutral;
  const totalSell = oscSell + maSell;
  const total = totalBuy + totalNeutral + totalSell;
  
  // Strength hesapla (-100 to +100, sonra 0-100'e cevir)
  const rawStrength = ((totalBuy - totalSell) / total) * 100;
  const strength = Math.round((rawStrength + 100) / 2);
  
  // Label belirle
  let label: 'GUCLU AL' | 'AL' | 'NOTR' | 'SAT' | 'GUCLU SAT';
  if (strength >= 75) label = 'GUCLU AL';
  else if (strength >= 55) label = 'AL';
  else if (strength >= 45) label = 'NOTR';
  else if (strength >= 25) label = 'SAT';
  else label = 'GUCLU SAT';
  
  return {
    strength,
    label,
    oscillators: { buy: oscBuy, neutral: oscNeutral, sell: oscSell },
    movingAverages: { buy: maBuy, neutral: maNeutral, sell: maSell },
    summary: { buy: totalBuy, neutral: totalNeutral, sell: totalSell },
  };
}

// Finviz tarzinda filtreleme
export function filterEliteResults(results: EliteScanResult[]): EliteScanResult[] {
  return results.filter(r => {
    // Deal breaker olanlar disinda
    if (r.risk.dealBreakers.length > 0) return false;
    
    // AVOID ve SELL disinda
    if (r.decision.action === 'AVOID' || r.decision.action === 'SELL') return false;
    
    // Minimum grade C (F ve D disinda)
    if (r.score.grade === 'F' || r.score.grade === 'D') return false;
    
    // Minimum conviction %55
    if (r.decision.conviction < 55) return false;
    
    // Risk extreme olmamali
    if (r.risk.level === 'extreme') return false;
    
    // En az 2 alim sinyali
    const totalBuySignals = r.signalSummary.strongBuyCount + r.signalSummary.buyCount;
    if (totalBuySignals < 2) return false;
    
    return true;
  });
}

// Pro Trader filtreleme - TOP 5 icin (kademeli)
// SABAH YESIL YAKMA SKORU DAHIL
export function filterUltraEliteResults(results: EliteScanResult[]): EliteScanResult[] {
  // Tum sonuclara kompozit skor ve sabah yesil skoru ekle
  const scoredResults = results.map(r => {
    const compositeScore = calculateCompositeScore(r);
    const signalStrength = calculateSignalStrength(r);
    const morningGreenScore = r.morningGreen?.morningGreenScore || 50;
    
    // MASTER SKOR: Kompozit + Sabah Yesil + Sinyal Gucu
    // Sabah yesil yakma icin optimize edilmis agirliklar
    const masterScore = Math.round(
      compositeScore * 0.35 +           // %35 teknik skor
      morningGreenScore * 0.40 +        // %40 sabah yesil skoru (EN ONEMLI!)
      signalStrength.strength * 0.25    // %25 sinyal gucu
    );
    
    return {
      ...r,
      compositeScore,
      signalStrength,
      masterScore,
    };
  });
  
  // MASTER SKOR'a gore sirala (sabah yesil oncelikli)
  scoredResults.sort((a, b) => {
    // Oncelik 1: Morning Green skoru yuksek olanlar
    const morningDiff = (b.morningGreen?.morningGreenScore || 0) - (a.morningGreen?.morningGreenScore || 0);
    if (Math.abs(morningDiff) > 15) return morningDiff;
    
    // Oncelik 2: Master skor
    return (b as typeof b & {masterScore: number}).masterScore - (a as typeof a & {masterScore: number}).masterScore;
  });
  
  // Minimum kriterler
  const filtered = scoredResults.filter(r => {
    // Deal breaker yok
    if (r.risk.dealBreakers.length > 0) return false;
    
    // AVOID ve SELL disinda
    if (r.decision.action === 'AVOID' || r.decision.action === 'SELL') return false;
    
    // Minimum kompozit skor 40
    if (r.compositeScore < 40) return false;
    
    // Sinyal gucu en az 40
    if (r.signalStrength.strength < 40) return false;
    
    // Risk extreme veya very_high olmamali
    if (r.risk.level === 'extreme' || r.risk.level === 'very_high') return false;
    
    return true;
  });
  
  // Eger yeterli sonuc yoksa, kriterleri gevset
  if (filtered.length < 5) {
    const relaxedFiltered = scoredResults.filter(r => {
      if (r.risk.dealBreakers.length > 0) return false;
      if (r.decision.action === 'AVOID') return false;
      if (r.compositeScore < 30) return false;
      if (r.risk.level === 'extreme') return false;
      return true;
    });
    return relaxedFiltered.slice(0, 5);
  }
  
  return filtered.slice(0, 5);
}
