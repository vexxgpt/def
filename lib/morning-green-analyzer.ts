// ==========================================
// SABAH YESIL YAKMA ANALIZ MOTORU
// Pro Trader - Trade Ideas & Edgeful Tarzi
// ==========================================

import { HistoricalBar, MorningGreenAnalysis, GapAnalysis, MomentumSurge, SmartMoneyActivity } from './elite-scanner-types';

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
    
    // Date objesine cevir (string veya Date olabilir)
    const barDate = bar.date instanceof Date ? bar.date : new Date(bar.date);
    
    last5Days.push({
      date: barDate.toISOString().split('T')[0],
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
