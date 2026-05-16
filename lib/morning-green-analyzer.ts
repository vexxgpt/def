// ==========================================
// SABAH YESIL YAKMA ANALIZ MOTORU V2
// Pro Trader - Trade Ideas & Edgeful Tarzi
// Dunya Standartlarinda Profesyonel Analiz
// ==========================================

import { 
  HistoricalBar, 
  MorningGreenAnalysis, 
  GapAnalysis, 
  MomentumSurge, 
  SmartMoneyActivity,
  ExtendedMorningGreenAnalysis,
  PremarketPrediction,
  HotStreakStock,
  ConfluenceScore
} from './elite-scanner-types';

// Sabah Yesil Yakma Analizi
export function analyzeMorningGreen(bars: HistoricalBar[], currentPrice: number): MorningGreenAnalysis {
  if (bars.length < 20) {
    return getDefaultMorningGreenAnalysis();
  }
  
  // Son 20 gunluk veriyi al (en yeni en sonda)
  const recentBars = bars.slice(-20);
  const last5Days: MorningGreenAnalysis['last5Days'] = [];
  
  // Son 5 gun icin detayli analiz
  for (let i = Math.max(0, recentBars.length - 5); i < recentBars.length; i++) {
    const bar = recentBars[i];
    const prevBar = recentBars[i - 1];
    
    if (!prevBar) continue;
    
    const gapPercent = ((bar.open - prevBar.close) / prevBar.close) * 100;
    const morningHigh = bar.high; // Simdilik gun yuksegi kullaniyoruz
    const morningGreen = bar.open > prevBar.close; // Sabah yesil acilis
    const closedGreen = bar.close > bar.open; // Gun yesil kapandi
    const afternoonReversal = bar.close < prevBar.close && bar.open > prevBar.close; // Sabah yesil, aksam kirmizi
    
    last5Days.push({
      date: bar.date.toISOString().split('T')[0],
      prevClose: prevBar.close,
      open: bar.open,
      gapPercent: Math.round(gapPercent * 100) / 100,
      morningHigh,
      morningGreen,
      closedGreen,
      afternoonReversal,
    });
  }
  
  // Istatistik hesaplamalari
  const stats = calculateMorningStats(recentBars);
  
  // Pattern tespiti
  const patterns = detectMorningPatterns(recentBars, last5Days);
  
  // Sabah Yesil Yakma Skoru (0-100)
  const morningGreenScore = calculateMorningGreenScore(stats, patterns);
  
  // Strateji onerisi
  const strategy = generateMorningStrategy(stats, patterns, morningGreenScore, currentPrice);
  
  return {
    last5Days,
    morningGreenScore,
    stats,
    strategy,
    patterns,
  };
}

function calculateMorningStats(bars: HistoricalBar[]): MorningGreenAnalysis['stats'] {
  const last5 = bars.slice(-5);
  const last10 = bars.slice(-10);
  const last20 = bars.slice(-20);
  
  // Sabah yesil sayilari
  let greenMornings5d = 0;
  let greenMornings10d = 0;
  let greenMornings20d = 0;
  
  // Gap ve hareket istatistikleri
  let totalGap = 0;
  let totalMorningMove = 0;
  let gapCount = 0;
  
  // 17:45 sonrasi guvenirlik
  let afternoonGreenToMorningRed = 0;
  let afternoonGreenToMorningGreen = 0;
  let afternoonGreenCount = 0;
  
  // Gap fill analizi
  let gapsFilled = 0;
  let totalGaps = 0;
  
  for (let i = 1; i < bars.length; i++) {
    const bar = bars[i];
    const prevBar = bars[i - 1];
    
    const gapPercent = ((bar.open - prevBar.close) / prevBar.close) * 100;
    const morningGreen = bar.open > prevBar.close;
    const morningMove = ((bar.high - bar.open) / bar.open) * 100;
    
    // Son 5 gun
    if (i >= bars.length - 5) {
      if (morningGreen) greenMornings5d++;
    }
    
    // Son 10 gun
    if (i >= bars.length - 10) {
      if (morningGreen) greenMornings10d++;
    }
    
    // Son 20 gun
    if (morningGreen) greenMornings20d++;
    
    // Gap istatistikleri
    totalGap += gapPercent;
    totalMorningMove += morningMove;
    gapCount++;
    
    // 17:45 sonrasi analizi (onceki gun yesil kapandi mi)
    if (prevBar.close > prevBar.open) { // Onceki gun yesil kapandi
      afternoonGreenCount++;
      if (morningGreen) {
        afternoonGreenToMorningGreen++;
      } else {
        afternoonGreenToMorningRed++;
      }
    }
    
    // Gap fill kontrolu
    if (Math.abs(gapPercent) > 0.5) {
      totalGaps++;
      // Gap yukari ve gun icinde onceki kapanis test edildi mi
      if (gapPercent > 0 && bar.low <= prevBar.close) {
        gapsFilled++;
      }
      // Gap asagi ve gun icinde onceki kapanis test edildi mi
      if (gapPercent < 0 && bar.high >= prevBar.close) {
        gapsFilled++;
      }
    }
  }
  
  const count5 = Math.min(5, last5.length - 1) || 1;
  const count10 = Math.min(10, last10.length - 1) || 1;
  const count20 = Math.min(20, last20.length - 1) || 1;
  
  return {
    greenMornings5d,
    greenMorningRate5d: Math.round((greenMornings5d / count5) * 100),
    greenMornings10d,
    greenMorningRate10d: Math.round((greenMornings10d / count10) * 100),
    greenMornings20d,
    greenMorningRate20d: Math.round((greenMornings20d / count20) * 100),
    avgMorningGap: gapCount > 0 ? Math.round((totalGap / gapCount) * 100) / 100 : 0,
    avgMorningMove: gapCount > 0 ? Math.round((totalMorningMove / gapCount) * 100) / 100 : 0,
    afternoonGreenToMorningRed,
    afternoonGreenToMorningGreen,
    afternoonReliability: afternoonGreenCount > 0 
      ? Math.round((afternoonGreenToMorningGreen / afternoonGreenCount) * 100) 
      : 50,
    gapFillRate: totalGaps > 0 ? Math.round((gapsFilled / totalGaps) * 100) : 50,
    avgGapFillTime: 45, // Dakika cinsinden ortalama (simulasyon)
  };
}

function detectMorningPatterns(bars: HistoricalBar[], last5Days: MorningGreenAnalysis['last5Days']): MorningGreenAnalysis['patterns'] {
  // Ust uste yesil sabahlar
  let consecutiveGreenMornings = 0;
  for (let i = last5Days.length - 1; i >= 0; i--) {
    if (last5Days[i].morningGreen) {
      consecutiveGreenMornings++;
    } else {
      break;
    }
  }
  
  // Hacim trendi
  const recentVolumes = bars.slice(-5).map(b => b.volume);
  const avgRecentVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
  const olderVolumes = bars.slice(-10, -5).map(b => b.volume);
  const avgOlderVolume = olderVolumes.length > 0 
    ? olderVolumes.reduce((a, b) => a + b, 0) / olderVolumes.length 
    : avgRecentVolume;
  
  let volumeTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (avgRecentVolume > avgOlderVolume * 1.2) volumeTrend = 'increasing';
  else if (avgRecentVolume < avgOlderVolume * 0.8) volumeTrend = 'decreasing';
  
  // Fiyat ivmelenmesi
  const recentCloses = bars.slice(-5).map(b => b.close);
  const priceChanges = [];
  for (let i = 1; i < recentCloses.length; i++) {
    priceChanges.push((recentCloses[i] - recentCloses[i-1]) / recentCloses[i-1] * 100);
  }
  const avgPriceChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  const lastPriceChange = priceChanges[priceChanges.length - 1] || 0;
  const priceAcceleration = lastPriceChange > avgPriceChange && lastPriceChange > 0;
  
  // Momentum kontrolu
  const hasMomentum = avgPriceChange > 0.5 && volumeTrend !== 'decreasing';
  
  return {
    consecutiveGreenMornings,
    isHotStreak: consecutiveGreenMornings >= 3,
    hasMomentum,
    volumeTrend,
    priceAcceleration,
  };
}

function calculateMorningGreenScore(
  stats: MorningGreenAnalysis['stats'], 
  patterns: MorningGreenAnalysis['patterns']
): number {
  let score = 0;
  
  // Son 5 gun yesil sabah orani (max 25 puan)
  score += (stats.greenMorningRate5d / 100) * 25;
  
  // Son 10 gun yesil sabah orani (max 20 puan)
  score += (stats.greenMorningRate10d / 100) * 20;
  
  // Son 20 gun yesil sabah orani (max 15 puan)
  score += (stats.greenMorningRate20d / 100) * 15;
  
  // 17:45 guvenirlik (max 15 puan)
  score += (stats.afternoonReliability / 100) * 15;
  
  // Ortalama sabah hareketi (max 10 puan)
  if (stats.avgMorningMove > 2) score += 10;
  else if (stats.avgMorningMove > 1) score += 7;
  else if (stats.avgMorningMove > 0.5) score += 4;
  
  // Pattern bonuslari (max 15 puan)
  if (patterns.isHotStreak) score += 8;
  if (patterns.hasMomentum) score += 4;
  if (patterns.priceAcceleration) score += 3;
  
  // Hacim bonusu
  if (patterns.volumeTrend === 'increasing') score += 5;
  else if (patterns.volumeTrend === 'decreasing') score -= 5;
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

function generateMorningStrategy(
  stats: MorningGreenAnalysis['stats'],
  patterns: MorningGreenAnalysis['patterns'],
  score: number,
  currentPrice: number
): MorningGreenAnalysis['strategy'] {
  const reasoning: string[] = [];
  let recommendation: MorningGreenAnalysis['strategy']['recommendation'] = 'WAIT_FOR_DIP';
  let confidence = 50;
  let optimalEntry: MorningGreenAnalysis['strategy']['optimalEntry'] = {
    type: 'FIRST_PULLBACK',
    timeWindow: 'Ilk 30 dakika',
  };
  
  // STRONG_MORNING_BUY kriterleri
  if (
    score >= 75 &&
    stats.greenMorningRate5d >= 80 &&
    stats.afternoonReliability >= 70 &&
    patterns.isHotStreak
  ) {
    recommendation = 'STRONG_MORNING_BUY';
    confidence = Math.min(95, score);
    reasoning.push(
      `MUKEMMEL SABAH POTANSIYELI! Skor: ${score}/100`,
      `Son 5 gunde ${stats.greenMornings5d}/5 sabah yesil`,
      `${patterns.consecutiveGreenMornings} gun ust uste yesil sabah (HOT STREAK!)`,
      `17:45 sonrasi guvenirlik: %${stats.afternoonReliability}`,
      `Ortalama sabah hareketi: %${stats.avgMorningMove}`
    );
    optimalEntry = {
      type: 'PREMARKET',
      priceLevel: currentPrice * 0.995, // %0.5 altinda
      timeWindow: 'Seans oncesi veya acilista',
    };
  }
  // MORNING_BUY kriterleri
  else if (
    score >= 55 &&
    stats.greenMorningRate5d >= 60 &&
    patterns.hasMomentum
  ) {
    recommendation = 'MORNING_BUY';
    confidence = Math.min(80, score);
    reasoning.push(
      `Iyi sabah potansiyeli. Skor: ${score}/100`,
      `Son 5 gunde ${stats.greenMornings5d}/5 sabah yesil`,
      `Momentum mevcut`,
      `Ortalama sabah gapi: %${stats.avgMorningGap}`
    );
    optimalEntry = {
      type: 'OPEN',
      timeWindow: 'Acilis ilk 5 dakika',
    };
  }
  // WAIT_FOR_DIP
  else if (score >= 40) {
    recommendation = 'WAIT_FOR_DIP';
    confidence = Math.min(65, score);
    reasoning.push(
      `Orta seviye potansiyel. Skor: ${score}/100`,
      `Son 5 gunde ${stats.greenMornings5d}/5 sabah yesil`,
      `Dip beklenebilir`
    );
    optimalEntry = {
      type: 'FIRST_PULLBACK',
      priceLevel: currentPrice * 0.98,
      timeWindow: 'Ilk dususte (09:30-10:00)',
    };
  }
  // AVOID_MORNING
  else if (score >= 25) {
    recommendation = 'AVOID_MORNING';
    confidence = 40;
    reasoning.push(
      `Dusuk sabah potansiyeli. Skor: ${score}/100`,
      `Son 5 gunde sadece ${stats.greenMornings5d}/5 sabah yesil`,
      `17:45 sonrasi guvenirlik dusuk: %${stats.afternoonReliability}`,
      `Sabah islemi icin uygun degil`
    );
    optimalEntry = {
      type: 'BREAKOUT',
      timeWindow: 'Gun icinde breakout bekleyin',
    };
  }
  // SHORT_CANDIDATE
  else {
    recommendation = 'SHORT_CANDIDATE';
    confidence = 50;
    reasoning.push(
      `Sabah kirmizi adayi! Skor: ${score}/100`,
      `Son 5 gunde sadece ${stats.greenMornings5d}/5 sabah yesil`,
      `Pattern zayif`,
      `Short pozisyon dusunulebilir`
    );
    optimalEntry = {
      type: 'OPEN',
      timeWindow: 'Acilista short giris',
    };
  }
  
  return {
    recommendation,
    confidence,
    reasoning,
    optimalEntry,
  };
}

// Gap Analizi
export function analyzeGap(bars: HistoricalBar[], currentPrice: number): GapAnalysis {
  if (bars.length < 2) {
    return getDefaultGapAnalysis();
  }
  
  const lastBar = bars[bars.length - 1];
  const prevBar = bars[bars.length - 2];
  
  // Mevcut gap
  const gapPercent = ((currentPrice - lastBar.close) / lastBar.close) * 100;
  let gapType: GapAnalysis['currentGap']['type'] = 'flat';
  let gapSize: GapAnalysis['currentGap']['size'] = 'none';
  
  if (gapPercent > 0.5) gapType = 'gap_up';
  else if (gapPercent < -0.5) gapType = 'gap_down';
  
  if (Math.abs(gapPercent) >= 3) gapSize = 'large';
  else if (Math.abs(gapPercent) >= 1.5) gapSize = 'medium';
  else if (Math.abs(gapPercent) >= 0.5) gapSize = 'small';
  
  // Tarihsel gap istatistikleri
  let gapUps = 0, gapDowns = 0;
  let totalGapUp = 0, totalGapDown = 0;
  let largeGapUpSuccess = 0, largeGapUpCount = 0;
  
  for (let i = 1; i < bars.length; i++) {
    const bar = bars[i];
    const prev = bars[i - 1];
    const gap = ((bar.open - prev.close) / prev.close) * 100;
    
    if (gap > 0.5) {
      gapUps++;
      totalGapUp += gap;
      
      if (gap >= 2) {
        largeGapUpCount++;
        if (bar.close > bar.open) largeGapUpSuccess++;
      }
    } else if (gap < -0.5) {
      gapDowns++;
      totalGapDown += Math.abs(gap);
    }
  }
  
  // Gap fill olasiligi
  let gapFillProbability = 50;
  if (gapSize === 'small') gapFillProbability = 75;
  else if (gapSize === 'medium') gapFillProbability = 55;
  else if (gapSize === 'large') gapFillProbability = 35;
  
  return {
    currentGap: {
      percent: Math.round(gapPercent * 100) / 100,
      type: gapType,
      size: gapSize,
    },
    historicalGaps: {
      avgGapUp: gapUps > 0 ? Math.round((totalGapUp / gapUps) * 100) / 100 : 0,
      avgGapDown: gapDowns > 0 ? Math.round((totalGapDown / gapDowns) * 100) / 100 : 0,
      gapUpFrequency: gapUps,
      gapDownFrequency: gapDowns,
      largeGapUpSuccess: largeGapUpCount > 0 
        ? Math.round((largeGapUpSuccess / largeGapUpCount) * 100) 
        : 50,
    },
    gapFillProbability,
  };
}

// Momentum Surge Detection
export function detectMomentumSurge(bars: HistoricalBar[], currentPrice: number, currentVolume: number): MomentumSurge {
  if (bars.length < 20) {
    return getDefaultMomentumSurge();
  }
  
  const avgVolume = bars.slice(-20).reduce((a, b) => a + b.volume, 0) / 20;
  const volumeMultiple = currentVolume / avgVolume;
  
  const lastBar = bars[bars.length - 1];
  const priceMove = ((currentPrice - lastBar.close) / lastBar.close) * 100;
  
  // Momentum surge tespiti
  let detected = false;
  let type: MomentumSurge['type'] = 'none';
  let strength = 0;
  
  if (volumeMultiple >= 2 && Math.abs(priceMove) >= 1) {
    detected = true;
    strength = Math.min(100, Math.round(volumeMultiple * 20 + Math.abs(priceMove) * 10));
    
    // Trend belirleme
    const recentTrend = bars.slice(-5).reduce((acc, bar, i, arr) => {
      if (i === 0) return 0;
      return acc + (bar.close - arr[i-1].close);
    }, 0);
    
    if (priceMove > 0 && recentTrend > 0) type = 'continuation';
    else if (priceMove > 0 && recentTrend <= 0) type = 'reversal';
    else if (Math.abs(priceMove) >= 2) type = 'breakout';
  }
  
  // AI Tahmini (basit model)
  const direction = priceMove > 0.5 ? 'up' : priceMove < -0.5 ? 'down' : 'neutral';
  const targetPercent = detected ? Math.abs(priceMove) * 1.5 : 0;
  const confidence = detected ? Math.min(85, strength) : 30;
  
  return {
    detected,
    type,
    strength,
    volumeMultiple: Math.round(volumeMultiple * 10) / 10,
    priceMove: Math.round(priceMove * 100) / 100,
    prediction: {
      direction,
      targetPercent: Math.round(targetPercent * 100) / 100,
      confidence,
      timeHorizon: detected ? '30min' : '1day',
    },
  };
}

// Smart Money Aktivitesi
export function analyzeSmartMoney(bars: HistoricalBar[], currentVolume: number): SmartMoneyActivity {
  if (bars.length < 20) {
    return getDefaultSmartMoneyActivity();
  }
  
  const avgVolume = bars.slice(-20).reduce((a, b) => a + b.volume, 0) / 20;
  const recentBars = bars.slice(-5);
  
  // Buyuk islem analizi
  const largeVolumeThreshold = avgVolume * 2;
  let largeTransactionCount = 0;
  let totalLargeVolume = 0;
  let netDirection = 0;
  
  for (const bar of recentBars) {
    if (bar.volume > largeVolumeThreshold) {
      largeTransactionCount++;
      totalLargeVolume += bar.volume;
      netDirection += bar.close > bar.open ? 1 : -1;
    }
  }
  
  // Kurumsal akis skoru
  let flowScore = 0;
  for (const bar of recentBars) {
    const volumeWeight = bar.volume / avgVolume;
    const priceChange = bar.close > bar.open ? 1 : -1;
    flowScore += priceChange * volumeWeight * 10;
  }
  flowScore = Math.max(-100, Math.min(100, flowScore));
  
  // Trend belirleme
  let trend: SmartMoneyActivity['institutionalFlow']['trend'] = 'neutral';
  if (flowScore > 20) trend = 'accumulation';
  else if (flowScore < -20) trend = 'distribution';
  
  // Unusual activity
  const volumeSpike = currentVolume > avgVolume * 2.5;
  const lastBar = bars[bars.length - 1];
  const priceSpike = Math.abs((lastBar.close - lastBar.open) / lastBar.open) > 0.03;
  
  let unusualType: SmartMoneyActivity['unusualActivity']['type'] = 'none';
  if (volumeSpike && priceSpike) unusualType = 'both';
  else if (volumeSpike) unusualType = 'volume_spike';
  else if (priceSpike) unusualType = 'price_spike';
  
  return {
    largeTransactions: {
      count: largeTransactionCount,
      totalVolume: totalLargeVolume,
      netDirection: netDirection > 0 ? 'buying' : netDirection < 0 ? 'selling' : 'neutral',
      avgSize: largeTransactionCount > 0 ? Math.round(totalLargeVolume / largeTransactionCount) : 0,
    },
    institutionalFlow: {
      score: Math.round(flowScore),
      trend,
      strength: Math.abs(flowScore) > 50 ? 'strong' : Math.abs(flowScore) > 20 ? 'moderate' : 'weak',
    },
    unusualActivity: {
      detected: unusualType !== 'none',
      type: unusualType,
      magnitude: volumeSpike ? currentVolume / avgVolume : 1,
    },
  };
}

// Default degerler
function getDefaultMorningGreenAnalysis(): MorningGreenAnalysis {
  return {
    last5Days: [],
    morningGreenScore: 50,
    stats: {
      greenMornings5d: 0,
      greenMorningRate5d: 50,
      greenMornings10d: 0,
      greenMorningRate10d: 50,
      greenMornings20d: 0,
      greenMorningRate20d: 50,
      avgMorningGap: 0,
      avgMorningMove: 0,
      afternoonGreenToMorningRed: 0,
      afternoonGreenToMorningGreen: 0,
      afternoonReliability: 50,
      gapFillRate: 50,
      avgGapFillTime: 45,
    },
    strategy: {
      recommendation: 'WAIT_FOR_DIP',
      confidence: 50,
      reasoning: ['Yeterli veri yok'],
      optimalEntry: { type: 'FIRST_PULLBACK', timeWindow: 'Ilk dususte' },
    },
    patterns: {
      consecutiveGreenMornings: 0,
      isHotStreak: false,
      hasMomentum: false,
      volumeTrend: 'stable',
      priceAcceleration: false,
    },
  };
}

function getDefaultGapAnalysis(): GapAnalysis {
  return {
    currentGap: { percent: 0, type: 'flat', size: 'none' },
    historicalGaps: {
      avgGapUp: 0,
      avgGapDown: 0,
      gapUpFrequency: 0,
      gapDownFrequency: 0,
      largeGapUpSuccess: 50,
    },
    gapFillProbability: 50,
  };
}

function getDefaultMomentumSurge(): MomentumSurge {
  return {
    detected: false,
    type: 'none',
    strength: 0,
    volumeMultiple: 1,
    priceMove: 0,
    prediction: {
      direction: 'neutral',
      targetPercent: 0,
      confidence: 30,
      timeHorizon: '1day',
    },
  };
}

function getDefaultSmartMoneyActivity(): SmartMoneyActivity {
  return {
  largeTransactions: { count: 0, totalVolume: 0, netDirection: 'neutral', avgSize: 0 },
  institutionalFlow: { score: 0, trend: 'neutral', strength: 'weak' },
  unusualActivity: { detected: false, type: 'none', magnitude: 1 },
  };
}

// ==========================================
// GELISMIS SABAH ANALIZI V2 - PRO TRADER
// ==========================================

// Gelismis Sabah Yesil Yakma Analizi
export function analyzeExtendedMorningGreen(
  bars: HistoricalBar[], 
  currentPrice: number,
  symbol: string
): ExtendedMorningGreenAnalysis {
  // Temel analizi al
  const baseAnalysis = analyzeMorningGreen(bars, currentPrice);
  
  // Yetersiz veri kontrolu
  if (bars.length < 30) {
    return {
      ...baseAnalysis,
      hotStreak: getDefaultHotStreak(),
      afternoonAnalysis: getDefaultAfternoonAnalysis(),
      gapFollowThrough: getDefaultGapFollowThrough(),
      timingAnalysis: getDefaultTimingAnalysis(),
      volumePriceCorrelation: getDefaultVolumeCorrelation(),
      aiPrediction: getDefaultAIPrediction(),
    };
  }
  
  const recentBars = bars.slice(-30);
  
  // Hot Streak Analizi
  const hotStreak = analyzeHotStreak(bars, baseAnalysis.patterns);
  
  // 17:45 Sonrasi Detayli Analiz
  const afternoonAnalysis = analyzeAfternoonReliability(bars);
  
  // Gap Follow-Through Analizi
  const gapFollowThrough = analyzeGapFollowThrough(bars);
  
  // Zaman Bazli Analiz
  const timingAnalysis = analyzeTimingPatterns(bars);
  
  // Hacim-Fiyat Korelasyonu
  const volumePriceCorrelation = analyzeVolumePriceCorrelation(bars);
  
  // AI Tahmin Motoru
  const aiPrediction = generateAIPrediction(
    baseAnalysis, 
    hotStreak, 
    afternoonAnalysis, 
    gapFollowThrough,
    bars
  );
  
  return {
    ...baseAnalysis,
    hotStreak,
    afternoonAnalysis,
    gapFollowThrough,
    timingAnalysis,
    volumePriceCorrelation,
    aiPrediction,
  };
}

// Hot Streak Analizi
function analyzeHotStreak(
  bars: HistoricalBar[], 
  patterns: MorningGreenAnalysis['patterns']
): ExtendedMorningGreenAnalysis['hotStreak'] {
  const recentBars = bars.slice(-30);
  
  // Mevcut streak hesapla
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let streakGains: number[] = [];
  let currentStreakGains: number[] = [];
  let streakStartIndex = -1;
  
  for (let i = 1; i < recentBars.length; i++) {
    const bar = recentBars[i];
    const prevBar = recentBars[i - 1];
    const morningGreen = bar.open > prevBar.close;
    
    if (morningGreen) {
      tempStreak++;
      const gain = ((bar.close - prevBar.close) / prevBar.close) * 100;
      streakGains.push(gain);
      
      if (i === recentBars.length - 1 || tempStreak > 0) {
        currentStreak = tempStreak;
        currentStreakGains = [...streakGains];
        if (streakStartIndex === -1) {
          streakStartIndex = i - tempStreak + 1;
        }
      }
      
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      streakGains = [];
      streakStartIndex = -1;
    }
  }
  
  // Son gun yesil degil ise streak sifirla
  if (recentBars.length >= 2) {
    const lastBar = recentBars[recentBars.length - 1];
    const prevBar = recentBars[recentBars.length - 2];
    if (lastBar.open <= prevBar.close) {
      currentStreak = 0;
      currentStreakGains = [];
    }
  }
  
  const isActive = currentStreak >= 3;
  const avgStreakGain = currentStreakGains.length > 0 
    ? currentStreakGains.reduce((a, b) => a + b, 0) / currentStreakGains.length 
    : 0;
  
  // Streak gucu hesapla
  let streakStrength = 0;
  if (isActive) {
    streakStrength = Math.min(100, 
      currentStreak * 15 + // Her gun 15 puan
      avgStreakGain * 10 + // Ortalama kazanc etkisi
      (patterns.hasMomentum ? 15 : 0) + // Momentum bonusu
      (patterns.volumeTrend === 'increasing' ? 10 : 0) // Hacim bonusu
    );
  }
  
  // Streak devam tahmini
  const continueProbability = isActive 
    ? Math.max(20, 85 - (currentStreak * 8)) // Her gun %8 azalma
    : 0;
  
  return {
    active: isActive,
    currentStreak,
    maxStreakLast30d: maxStreak,
    streakStrength: Math.round(streakStrength),
    avgStreakGain: Math.round(avgStreakGain * 100) / 100,
    streakStartDate: streakStartIndex >= 0 
      ? recentBars[streakStartIndex]?.date.toISOString().split('T')[0] 
      : undefined,
    streakEndPrediction: isActive ? {
      probability: continueProbability,
      reasoning: currentStreak >= 5 
        ? 'Uzun streak - yorgunluk belirtileri izlenmeli'
        : 'Streak gucleniyor - momentum devam edebilir',
    } : undefined,
  };
}

// 17:45 Sonrasi Detayli Analiz
function analyzeAfternoonReliability(
  bars: HistoricalBar[]
): ExtendedMorningGreenAnalysis['afternoonAnalysis'] {
  const recentBars = bars.slice(-20);
  
  let greenCloseToGreenMorning = 0;
  let greenCloseToRedMorning = 0;
  let redCloseToGreenMorning = 0;
  let redCloseToRedMorning = 0;
  
  let gapsAfterGreenClose: number[] = [];
  let gapsAfterRedClose: number[] = [];
  
  for (let i = 1; i < recentBars.length; i++) {
    const bar = recentBars[i];
    const prevBar = recentBars[i - 1];
    
    const prevClosedGreen = prevBar.close > prevBar.open;
    const morningGreen = bar.open > prevBar.close;
    const gap = ((bar.open - prevBar.close) / prevBar.close) * 100;
    
    if (prevClosedGreen) {
      gapsAfterGreenClose.push(gap);
      if (morningGreen) {
        greenCloseToGreenMorning++;
      } else {
        greenCloseToRedMorning++;
      }
    } else {
      gapsAfterRedClose.push(gap);
      if (morningGreen) {
        redCloseToGreenMorning++;
      } else {
        redCloseToRedMorning++;
      }
    }
  }
  
  const greenCloseTotal = greenCloseToGreenMorning + greenCloseToRedMorning;
  const redCloseTotal = redCloseToGreenMorning + redCloseToRedMorning;
  
  const greenCloseReliability = greenCloseTotal > 0 
    ? Math.round((greenCloseToGreenMorning / greenCloseTotal) * 100) 
    : 50;
  
  const redCloseReliability = redCloseTotal > 0 
    ? Math.round((redCloseToGreenMorning / redCloseTotal) * 100) 
    : 50;
  
  const avgGapAfterGreenClose = gapsAfterGreenClose.length > 0
    ? gapsAfterGreenClose.reduce((a, b) => a + b, 0) / gapsAfterGreenClose.length
    : 0;
  
  const avgGapAfterRedClose = gapsAfterRedClose.length > 0
    ? gapsAfterRedClose.reduce((a, b) => a + b, 0) / gapsAfterRedClose.length
    : 0;
  
  // Bugun icin tahmin
  const lastBar = recentBars[recentBars.length - 1];
  const todayClosedGreen = lastBar ? lastBar.close > lastBar.open : false;
  
  const tomorrowGreenProbability = todayClosedGreen 
    ? greenCloseReliability 
    : redCloseReliability;
  
  const tomorrowExpectedGap = todayClosedGreen 
    ? avgGapAfterGreenClose 
    : avgGapAfterRedClose;
  
  return {
    greenCloseToGreenMorning,
    greenCloseToRedMorning,
    greenCloseReliability,
    redCloseToGreenMorning,
    redCloseToRedMorning,
    redCloseReliability,
    avgGapAfterGreenClose: Math.round(avgGapAfterGreenClose * 100) / 100,
    avgGapAfterRedClose: Math.round(avgGapAfterRedClose * 100) / 100,
    todayPrediction: {
      closedGreen: todayClosedGreen,
      tomorrowExpectedGap: Math.round(tomorrowExpectedGap * 100) / 100,
      tomorrowGreenProbability,
      confidence: Math.min(85, Math.max(40, tomorrowGreenProbability)),
      reasoning: [
        todayClosedGreen 
          ? `Bugun yesil kapandi - tarihsel olarak %${greenCloseReliability} sabah yesil`
          : `Bugun kirmizi kapandi - tarihsel olarak %${redCloseReliability} sabah yesil`,
        `Beklenen gap: %${Math.round(tomorrowExpectedGap * 100) / 100}`,
      ],
    },
  };
}

// Gap Follow-Through Analizi
function analyzeGapFollowThrough(
  bars: HistoricalBar[]
): ExtendedMorningGreenAnalysis['gapFollowThrough'] {
  const recentBars = bars.slice(-30);
  
  let gapUpFollowCount = 0;
  let gapUpTotalCount = 0;
  let gapDownFollowCount = 0;
  let gapDownTotalCount = 0;
  
  let gapUpContinuations: number[] = [];
  let gapDownContinuations: number[] = [];
  
  const last10Gaps: ExtendedMorningGreenAnalysis['gapFollowThrough']['last10Gaps'] = [];
  
  for (let i = 1; i < recentBars.length; i++) {
    const bar = recentBars[i];
    const prevBar = recentBars[i - 1];
    
    const gapPercent = ((bar.open - prevBar.close) / prevBar.close) * 100;
    
    // Sadece anlamli gap'leri say (>0.5%)
    if (Math.abs(gapPercent) >= 0.5) {
      const followThrough = gapPercent > 0 
        ? bar.close > bar.open // Gap up sonrasi yesil kapandi mi
        : bar.close < bar.open; // Gap down sonrasi kirmizi kapandi mi
      
      const continuationPercent = ((bar.close - bar.open) / bar.open) * 100;
      
      if (gapPercent > 0) {
        gapUpTotalCount++;
        if (followThrough) {
          gapUpFollowCount++;
          gapUpContinuations.push(continuationPercent);
        }
      } else {
        gapDownTotalCount++;
        if (followThrough) {
          gapDownFollowCount++;
          gapDownContinuations.push(Math.abs(continuationPercent));
        }
      }
      
      // Son 10 gap'i kaydet
      if (last10Gaps.length < 10) {
        last10Gaps.unshift({
          date: bar.date.toISOString().split('T')[0],
          gapPercent: Math.round(gapPercent * 100) / 100,
          followThrough,
          continuationPercent: Math.round(continuationPercent * 100) / 100,
        });
      }
    }
  }
  
  const gapUpFollowThroughRate = gapUpTotalCount > 0 
    ? Math.round((gapUpFollowCount / gapUpTotalCount) * 100) 
    : 50;
  
  const gapDownFollowThroughRate = gapDownTotalCount > 0 
    ? Math.round((gapDownFollowCount / gapDownTotalCount) * 100) 
    : 50;
  
  const avgGapUpContinuation = gapUpContinuations.length > 0
    ? gapUpContinuations.reduce((a, b) => a + b, 0) / gapUpContinuations.length
    : 0;
  
  const avgGapDownContinuation = gapDownContinuations.length > 0
    ? gapDownContinuations.reduce((a, b) => a + b, 0) / gapDownContinuations.length
    : 0;
  
  // Pattern tespiti
  let gapPattern: ExtendedMorningGreenAnalysis['gapFollowThrough']['gapPattern'] = 'mixed';
  const avgFollowThrough = (gapUpFollowThroughRate + gapDownFollowThroughRate) / 2;
  
  if (avgFollowThrough >= 70) {
    gapPattern = 'consistent_follow';
  } else if (avgFollowThrough <= 30) {
    gapPattern = 'gap_and_reverse';
  } else if (avgFollowThrough >= 40 && avgFollowThrough <= 60) {
    gapPattern = 'gap_fill';
  }
  
  return {
    gapUpFollowThroughRate,
    gapDownFollowThroughRate,
    avgGapUpContinuation: Math.round(avgGapUpContinuation * 100) / 100,
    avgGapDownContinuation: Math.round(avgGapDownContinuation * 100) / 100,
    last10Gaps,
    gapPattern,
    patternStrength: Math.abs(avgFollowThrough - 50) * 2, // 0-100 arasi
  };
}

// Zaman Bazli Analiz
function analyzeTimingPatterns(
  bars: HistoricalBar[]
): ExtendedMorningGreenAnalysis['timingAnalysis'] {
  const recentBars = bars.slice(-20);
  
  // Ilk 30 dakika istatistikleri (yaklaşık - gunluk veri ile)
  let morningMoves: number[] = [];
  let upMornings = 0;
  
  for (let i = 1; i < recentBars.length; i++) {
    const bar = recentBars[i];
    const prevBar = recentBars[i - 1];
    
    // Sabah hareketi: acilistan yuksek veya dusuk fiyata
    const morningMove = ((bar.high - bar.open) / bar.open) * 100;
    morningMoves.push(morningMove);
    
    if (bar.open > prevBar.close) {
      upMornings++;
    }
  }
  
  const avgMorningMove = morningMoves.length > 0
    ? morningMoves.reduce((a, b) => a + b, 0) / morningMoves.length
    : 0;
  
  const upProbability = recentBars.length > 1
    ? Math.round((upMornings / (recentBars.length - 1)) * 100)
    : 50;
  
  const sortedMoves = [...morningMoves].sort((a, b) => b - a);
  const bestScenario = sortedMoves[0] || 0;
  const worstScenario = sortedMoves[sortedMoves.length - 1] || 0;
  
  return {
    optimalEntryTime: upProbability >= 60 ? '09:35' : '09:45',
    optimalEntryReasoning: upProbability >= 60 
      ? 'Yuksek sabah yesil orani - erken giris avantajli'
      : 'Dusuk sabah yesil orani - ilk dipi beklemek daha guvenli',
    hourlyPerformance: [
      { hour: '09:30', avgReturn: avgMorningMove * 0.4, winRate: upProbability, sampleSize: recentBars.length - 1 },
      { hour: '10:00', avgReturn: avgMorningMove * 0.6, winRate: Math.max(40, upProbability - 5), sampleSize: recentBars.length - 1 },
      { hour: '11:00', avgReturn: avgMorningMove * 0.8, winRate: Math.max(40, upProbability - 10), sampleSize: recentBars.length - 1 },
      { hour: '14:00', avgReturn: avgMorningMove * 0.5, winRate: 50, sampleSize: recentBars.length - 1 },
      { hour: '17:00', avgReturn: avgMorningMove * 0.3, winRate: 50, sampleSize: recentBars.length - 1 },
    ],
    first30MinStats: {
      avgMove: Math.round(avgMorningMove * 100) / 100,
      upProbability,
      bestScenario: Math.round(bestScenario * 100) / 100,
      worstScenario: Math.round(worstScenario * 100) / 100,
    },
  };
}

// Hacim-Fiyat Korelasyonu
function analyzeVolumePriceCorrelation(
  bars: HistoricalBar[]
): ExtendedMorningGreenAnalysis['volumePriceCorrelation'] {
  const recentBars = bars.slice(-20);
  
  if (recentBars.length < 10) {
    return getDefaultVolumeCorrelation();
  }
  
  const avgVolume = recentBars.reduce((a, b) => a + b.volume, 0) / recentBars.length;
  
  let highVolumeGreenMornings = 0;
  let highVolumeDays = 0;
  let lowVolumeGreenMornings = 0;
  let lowVolumeDays = 0;
  
  // Korelasyon hesabi icin veri toplama
  const volumeChanges: number[] = [];
  const priceChanges: number[] = [];
  
  for (let i = 1; i < recentBars.length; i++) {
    const bar = recentBars[i];
    const prevBar = recentBars[i - 1];
    
    const morningGreen = bar.open > prevBar.close;
    const volumeRatio = bar.volume / avgVolume;
    
    volumeChanges.push(volumeRatio - 1);
    priceChanges.push(morningGreen ? 1 : -1);
    
    if (volumeRatio > 1.2) {
      highVolumeDays++;
      if (morningGreen) highVolumeGreenMornings++;
    } else if (volumeRatio < 0.8) {
      lowVolumeDays++;
      if (morningGreen) lowVolumeGreenMornings++;
    }
  }
  
  // Pearson korelasyon katsayisi (basitlestirilmis)
  const n = volumeChanges.length;
  const sumX = volumeChanges.reduce((a, b) => a + b, 0);
  const sumY = priceChanges.reduce((a, b) => a + b, 0);
  const sumXY = volumeChanges.reduce((a, b, i) => a + b * priceChanges[i], 0);
  const sumX2 = volumeChanges.reduce((a, b) => a + b * b, 0);
  const sumY2 = priceChanges.reduce((a, b) => a + b * b, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  const correlation = denominator !== 0 ? numerator / denominator : 0;
  
  const highVolumeGreenRate = highVolumeDays > 0 
    ? Math.round((highVolumeGreenMornings / highVolumeDays) * 100) 
    : 50;
  
  const lowVolumeGreenRate = lowVolumeDays > 0 
    ? Math.round((lowVolumeGreenMornings / lowVolumeDays) * 100) 
    : 50;
  
  let correlationStrength: ExtendedMorningGreenAnalysis['volumePriceCorrelation']['correlationStrength'] = 'none';
  if (Math.abs(correlation) > 0.7) correlationStrength = 'strong';
  else if (Math.abs(correlation) > 0.4) correlationStrength = 'moderate';
  else if (Math.abs(correlation) > 0.2) correlationStrength = 'weak';
  
  return {
    morningVolumeToPrice: Math.round(correlation * 100) / 100,
    highVolumeGreenMorningRate: highVolumeGreenRate,
    lowVolumeGreenMorningRate: lowVolumeGreenRate,
    volumePredictsPriceDirection: Math.abs(correlation) > 0.4,
    correlationStrength,
  };
}

// AI Tahmin Motoru
function generateAIPrediction(
  baseAnalysis: MorningGreenAnalysis,
  hotStreak: ExtendedMorningGreenAnalysis['hotStreak'],
  afternoonAnalysis: ExtendedMorningGreenAnalysis['afternoonAnalysis'],
  gapFollowThrough: ExtendedMorningGreenAnalysis['gapFollowThrough'],
  bars: HistoricalBar[]
): ExtendedMorningGreenAnalysis['aiPrediction'] {
  const factors: ExtendedMorningGreenAnalysis['aiPrediction']['factors'] = [];
  
  // Faktor 1: Son 5 gun yesil sabah orani
  const greenRate5d = baseAnalysis.stats.greenMorningRate5d;
  factors.push({
    name: 'Son 5 Gun Yesil Sabah',
    impact: greenRate5d >= 60 ? 'positive' : greenRate5d <= 40 ? 'negative' : 'neutral',
    weight: 25,
  });
  
  // Faktor 2: 17:45 Guvenilirligi
  const afternoonReliability = afternoonAnalysis.todayPrediction.tomorrowGreenProbability;
  factors.push({
    name: '17:45 Kapanış Güvenilirliği',
    impact: afternoonReliability >= 60 ? 'positive' : afternoonReliability <= 40 ? 'negative' : 'neutral',
    weight: 20,
  });
  
  // Faktor 3: Hot Streak
  factors.push({
    name: 'Hot Streak Durumu',
    impact: hotStreak.active ? 'positive' : 'neutral',
    weight: 15,
  });
  
  // Faktor 4: Gap Follow-Through
  factors.push({
    name: 'Gap Devam Orani',
    impact: gapFollowThrough.gapUpFollowThroughRate >= 60 ? 'positive' : 
            gapFollowThrough.gapUpFollowThroughRate <= 40 ? 'negative' : 'neutral',
    weight: 15,
  });
  
  // Faktor 5: Momentum
  factors.push({
    name: 'Momentum',
    impact: baseAnalysis.patterns.hasMomentum ? 'positive' : 
            baseAnalysis.patterns.volumeTrend === 'decreasing' ? 'negative' : 'neutral',
    weight: 15,
  });
  
  // Faktor 6: Hacim Trendi
  factors.push({
    name: 'Hacim Trendi',
    impact: baseAnalysis.patterns.volumeTrend === 'increasing' ? 'positive' :
            baseAnalysis.patterns.volumeTrend === 'decreasing' ? 'negative' : 'neutral',
    weight: 10,
  });
  
  // Tahmin hesaplama
  let greenProbability = 50;
  let confidence = 50;
  
  for (const factor of factors) {
    if (factor.impact === 'positive') {
      greenProbability += factor.weight * 0.4;
      confidence += factor.weight * 0.3;
    } else if (factor.impact === 'negative') {
      greenProbability -= factor.weight * 0.4;
      confidence += factor.weight * 0.2;
    }
  }
  
  // Afternoon analizi ekstra agirlik
  greenProbability = (greenProbability * 0.6) + (afternoonReliability * 0.4);
  
  greenProbability = Math.max(10, Math.min(95, greenProbability));
  confidence = Math.max(30, Math.min(90, confidence));
  
  // Beklenen gap
  const expectedGap = afternoonAnalysis.todayPrediction.tomorrowExpectedGap;
  
  // Oneri
  let recommendation: ExtendedMorningGreenAnalysis['aiPrediction']['recommendation'] = 'WAIT';
  let riskLevel: ExtendedMorningGreenAnalysis['aiPrediction']['riskLevel'] = 'medium';
  
  if (greenProbability >= 75 && confidence >= 70) {
    recommendation = 'STRONG_BUY_MORNING';
    riskLevel = 'low';
  } else if (greenProbability >= 60 && confidence >= 55) {
    recommendation = 'BUY_MORNING';
    riskLevel = 'medium';
  } else if (greenProbability <= 35) {
    recommendation = greenProbability <= 25 ? 'SHORT_MORNING' : 'AVOID_MORNING';
    riskLevel = 'high';
  }
  
  return {
    tomorrowGreenProbability: Math.round(greenProbability),
    tomorrowExpectedGap: Math.round(expectedGap * 100) / 100,
    confidence: Math.round(confidence),
    factors,
    recommendation,
    riskLevel,
  };
}

// Hot Streak Hisselerini Bul
export function findHotStreakStocks(
  allResults: { symbol: string; name: string; bars: HistoricalBar[]; currentPrice: number }[]
): HotStreakStock[] {
  const hotStocks: HotStreakStock[] = [];
  
  for (const stock of allResults) {
    if (stock.bars.length < 10) continue;
    
    const bars = stock.bars.slice(-10);
    let streak = 0;
    let streakGain = 0;
    let streakStartIdx = -1;
    
    // Son gunlerden geriye dogru streak say
    for (let i = bars.length - 1; i >= 1; i--) {
      const bar = bars[i];
      const prevBar = bars[i - 1];
      
      if (bar.open > prevBar.close) {
        streak++;
        streakGain += ((bar.close - prevBar.close) / prevBar.close) * 100;
        streakStartIdx = i;
      } else {
        break;
      }
    }
    
    // En az 3 gunluk streak varsa listeye ekle
    if (streak >= 3) {
      const avgDailyGain = streakGain / streak;
      
      // Streak gucu hesapla
      const recentVolumes = bars.slice(-streak).map(b => b.volume);
      const avgVol = bars.slice(0, -streak).reduce((a, b) => a + b.volume, 0) / (bars.length - streak) || 1;
      const volumeConfirmation = recentVolumes.every(v => v > avgVol * 0.8);
      
      // Momentum ivmelenmesi
      const gains = [];
      for (let i = 1; i < streak + 1 && i < bars.length; i++) {
        const idx = bars.length - i;
        const bar = bars[idx];
        const prevBar = bars[idx - 1];
        if (prevBar) {
          gains.push(((bar.close - prevBar.close) / prevBar.close) * 100);
        }
      }
      const momentumAcceleration = gains.length >= 2 && gains[0] > gains[gains.length - 1];
      
      // Streak gucu
      const streakStrength = Math.min(100,
        streak * 20 +
        avgDailyGain * 10 +
        (volumeConfirmation ? 15 : 0) +
        (momentumAcceleration ? 10 : 0)
      );
      
      // Devam olasiligi
      const continueProbability = Math.max(20, 85 - (streak * 10));
      
      // Beklenen gap (basit tahmin)
      const expectedNextGap = avgDailyGain * 0.6;
      
      // Yorulma riski
      const exhaustionRisk = Math.min(100, streak * 15 + (avgDailyGain > 3 ? 20 : 0));
      
      // Fiyat uzamis mi
      const priceOverextended = streakGain > 10 || streak > 5;
      
      hotStocks.push({
        symbol: stock.symbol,
        name: stock.name,
        currentStreak: streak,
        streakStartDate: bars[streakStartIdx]?.date.toISOString().split('T')[0] || '',
        streakGain: Math.round(streakGain * 100) / 100,
        avgDailyGain: Math.round(avgDailyGain * 100) / 100,
        streakStrength: Math.round(streakStrength),
        momentumAcceleration,
        volumeConfirmation,
        streakContinueProbability: continueProbability,
        expectedNextGap: Math.round(expectedNextGap * 100) / 100,
        streakExhaustionRisk: exhaustionRisk,
        priceOverextended,
        hotScore: Math.round(streakStrength * 0.7 + continueProbability * 0.3),
        rank: 0, // Sonra siralama yapilacak
      });
    }
  }
  
  // Hot score'a gore sirala
  hotStocks.sort((a, b) => b.hotScore - a.hotScore);
  
  // Sira numarasi ekle
  hotStocks.forEach((stock, idx) => {
    stock.rank = idx + 1;
  });
  
  return hotStocks.slice(0, 20); // En sicak 20 hisse
}

// Confluence Skoru Hesapla
export function calculateConfluenceScore(
  signals: { category: string; type: string }[]
): ConfluenceScore {
  const categories: ConfluenceScore['categories'] = {
    momentum: { buy: 0, sell: 0, neutral: 0 },
    trend: { buy: 0, sell: 0, neutral: 0 },
    volume: { buy: 0, sell: 0, neutral: 0 },
    pattern: { buy: 0, sell: 0, neutral: 0 },
    supportResistance: { buy: 0, sell: 0, neutral: 0 },
    ichimoku: { buy: 0, sell: 0, neutral: 0 },
    multiTimeframe: { buy: 0, sell: 0, neutral: 0 },
  };
  
  // Sinyalleri kategorilere ayir
  for (const signal of signals) {
    const cat = signal.category as keyof typeof categories;
    if (!categories[cat]) continue;
    
    if (signal.type === 'strong_buy' || signal.type === 'buy') {
      categories[cat].buy++;
    } else if (signal.type === 'strong_sell' || signal.type === 'sell') {
      categories[cat].sell++;
    } else {
      categories[cat].neutral++;
    }
  }
  
  // Toplamlar
  let totalBuy = 0;
  let totalSell = 0;
  let totalNeutral = 0;
  let alignedBuy = 0;
  let alignedSell = 0;
  
  for (const cat of Object.values(categories)) {
    totalBuy += cat.buy;
    totalSell += cat.sell;
    totalNeutral += cat.neutral;
    
    // 3+ alim sinyali olan kategoriler
    if (cat.buy >= 2 && cat.buy > cat.sell) alignedBuy++;
    if (cat.sell >= 2 && cat.sell > cat.buy) alignedSell++;
  }
  
  // Perfect Setup kontrolu
  const isPerfectSetup = alignedBuy >= 5 || alignedSell >= 5;
  const perfectSetupType = isPerfectSetup 
    ? (alignedBuy >= 5 ? 'BUY' : 'SELL') 
    : undefined;
  
  // Confluence Skoru (-100 to +100)
  const total = totalBuy + totalSell + totalNeutral || 1;
  const score = Math.round(((totalBuy - totalSell) / total) * 100);
  
  // Strength belirleme
  let strength: ConfluenceScore['strength'] = 'weak';
  if (score >= 60) strength = alignedBuy >= 5 ? 'extreme_buy' : 'strong_buy';
  else if (score >= 30) strength = 'moderate_buy';
  else if (score <= -60) strength = alignedSell >= 5 ? 'extreme_sell' : 'strong_sell';
  else if (score <= -30) strength = 'moderate_sell';
  
  // Guven ve guvenilirlik
  const confidence = Math.min(95, 50 + Math.abs(score) * 0.4 + alignedBuy * 5 + alignedSell * 5);
  const reliability = isPerfectSetup ? 85 : alignedBuy >= 3 || alignedSell >= 3 ? 70 : 55;
  
  return {
    categories,
    totalBuySignals: totalBuy,
    totalSellSignals: totalSell,
    totalNeutralSignals: totalNeutral,
    alignedBuyCategories: alignedBuy,
    alignedSellCategories: alignedSell,
    isPerfectSetup,
    perfectSetupType,
    score,
    strength,
    confidence: Math.round(confidence),
    reliability,
  };
}

// Default degerler
function getDefaultHotStreak(): ExtendedMorningGreenAnalysis['hotStreak'] {
  return {
    active: false,
    currentStreak: 0,
    maxStreakLast30d: 0,
    streakStrength: 0,
    avgStreakGain: 0,
  };
}

function getDefaultAfternoonAnalysis(): ExtendedMorningGreenAnalysis['afternoonAnalysis'] {
  return {
    greenCloseToGreenMorning: 0,
    greenCloseToRedMorning: 0,
    greenCloseReliability: 50,
    redCloseToGreenMorning: 0,
    redCloseToRedMorning: 0,
    redCloseReliability: 50,
    avgGapAfterGreenClose: 0,
    avgGapAfterRedClose: 0,
    todayPrediction: {
      closedGreen: false,
      tomorrowExpectedGap: 0,
      tomorrowGreenProbability: 50,
      confidence: 50,
      reasoning: ['Yetersiz veri'],
    },
  };
}

function getDefaultGapFollowThrough(): ExtendedMorningGreenAnalysis['gapFollowThrough'] {
  return {
    gapUpFollowThroughRate: 50,
    gapDownFollowThroughRate: 50,
    avgGapUpContinuation: 0,
    avgGapDownContinuation: 0,
    last10Gaps: [],
    gapPattern: 'mixed',
    patternStrength: 0,
  };
}

function getDefaultTimingAnalysis(): ExtendedMorningGreenAnalysis['timingAnalysis'] {
  return {
    optimalEntryTime: '09:45',
    optimalEntryReasoning: 'Yetersiz veri - varsayilan zaman',
    hourlyPerformance: [],
    first30MinStats: {
      avgMove: 0,
      upProbability: 50,
      bestScenario: 0,
      worstScenario: 0,
    },
  };
}

function getDefaultVolumeCorrelation(): ExtendedMorningGreenAnalysis['volumePriceCorrelation'] {
  return {
    morningVolumeToPrice: 0,
    highVolumeGreenMorningRate: 50,
    lowVolumeGreenMorningRate: 50,
    volumePredictsPriceDirection: false,
    correlationStrength: 'none',
  };
}

function getDefaultAIPrediction(): ExtendedMorningGreenAnalysis['aiPrediction'] {
  return {
    tomorrowGreenProbability: 50,
    tomorrowExpectedGap: 0,
    confidence: 30,
    factors: [],
    recommendation: 'WAIT',
    riskLevel: 'medium',
  };
}
