// ==========================================
// PREMARKET SCANNER - Trade Ideas Tarzi
// Dunya Standartlarinda Sabah Tahmini
// ==========================================

import { 
  HistoricalBar, 
  PremarketPrediction,
  MorningScanResult,
  HotStreakStock,
  ExtendedMorningGreenAnalysis
} from './elite-scanner-types';
import { 
  analyzeExtendedMorningGreen, 
  findHotStreakStocks,
  calculateConfluenceScore 
} from './morning-green-analyzer';

// Premarket Tahmin Motoru
export function generatePremarketPrediction(
  symbol: string,
  bars: HistoricalBar[],
  currentPrice: number,
  extendedAnalysis: ExtendedMorningGreenAnalysis
): PremarketPrediction {
  if (bars.length < 20) {
    return getDefaultPremarketPrediction(symbol);
  }

  const recentBars = bars.slice(-30);
  const lastBar = recentBars[recentBars.length - 1];
  
  // Gap Tahmini
  const predictedGap = predictGap(recentBars, extendedAnalysis);
  
  // Momentum Tahmini
  const momentumForecast = forecastMomentum(recentBars, extendedAnalysis);
  
  // Pattern Eslestirme
  const patternMatch = matchHistoricalPatterns(recentBars, lastBar);
  
  // Hacim Beklentisi
  const volumeExpectation = predictVolume(recentBars);
  
  // Risk Skoru
  const premarketRisk = calculatePremarketRisk(
    predictedGap, 
    momentumForecast, 
    extendedAnalysis
  );
  
  // Strateji Onerisi
  const strategy = generatePremarketStrategy(
    predictedGap,
    momentumForecast,
    patternMatch,
    premarketRisk,
    currentPrice,
    extendedAnalysis
  );
  
  return {
    symbol,
    predictedGap,
    momentumForecast,
    patternMatch,
    volumeExpectation,
    premarketRisk,
    strategy,
    lastUpdated: new Date(),
  };
}

// Gap Tahmini
function predictGap(
  bars: HistoricalBar[],
  analysis: ExtendedMorningGreenAnalysis
): PremarketPrediction['predictedGap'] {
  // Son 10 gap'in ortalamasini al
  const gaps: number[] = [];
  for (let i = 1; i < Math.min(11, bars.length); i++) {
    const bar = bars[bars.length - i];
    const prevBar = bars[bars.length - i - 1];
    if (prevBar) {
      gaps.push(((bar.open - prevBar.close) / prevBar.close) * 100);
    }
  }
  
  const avgGap = gaps.length > 0 
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length 
    : 0;
  
  // 17:45 analizine gore tahmini ayarla
  let predictedPercent = analysis.afternoonAnalysis.todayPrediction.tomorrowExpectedGap;
  
  // Hot streak varsa yukari ayarla
  if (analysis.hotStreak.active) {
    predictedPercent += analysis.hotStreak.avgStreakGain * 0.3;
  }
  
  // Momentum varsa ayarla
  if (analysis.patterns.hasMomentum) {
    predictedPercent += 0.3;
  } else if (analysis.patterns.volumeTrend === 'decreasing') {
    predictedPercent -= 0.2;
  }
  
  // Direction belirleme
  const direction: 'up' | 'down' | 'flat' = 
    predictedPercent > 0.3 ? 'up' : 
    predictedPercent < -0.3 ? 'down' : 'flat';
  
  // Confidence hesaplama
  const confidence = Math.min(85, 
    50 + 
    (analysis.afternoonAnalysis.greenCloseReliability - 50) * 0.3 +
    (analysis.hotStreak.active ? 15 : 0) +
    (Math.abs(avgGap) < 1 ? 10 : 0) // Dusuk volatilite = daha tahmin edilebilir
  );
  
  // Range hesaplama (standart sapma bazli)
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const minGap = sortedGaps[0] || -1;
  const maxGap = sortedGaps[sortedGaps.length - 1] || 1;
  
  return {
    percent: Math.round(predictedPercent * 100) / 100,
    direction,
    confidence: Math.round(confidence),
    range: {
      min: Math.round(Math.min(predictedPercent - 0.5, minGap) * 100) / 100,
      max: Math.round(Math.max(predictedPercent + 0.5, maxGap) * 100) / 100,
    },
  };
}

// Momentum Tahmini
function forecastMomentum(
  bars: HistoricalBar[],
  analysis: ExtendedMorningGreenAnalysis
): PremarketPrediction['momentumForecast'] {
  const recentBars = bars.slice(-5);
  
  // Son 5 gunun momentum yonu
  let upDays = 0;
  let totalMove = 0;
  
  for (let i = 1; i < recentBars.length; i++) {
    const bar = recentBars[i];
    const prevBar = recentBars[i - 1];
    
    if (bar.close > prevBar.close) upDays++;
    totalMove += ((bar.close - prevBar.close) / prevBar.close) * 100;
  }
  
  const avgMove = totalMove / (recentBars.length - 1);
  
  // Direction
  let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (upDays >= 3 && avgMove > 0.5) direction = 'bullish';
  else if (upDays <= 1 && avgMove < -0.5) direction = 'bearish';
  
  // Strength
  let strength = 50;
  if (analysis.hotStreak.active) strength += 25;
  if (analysis.patterns.hasMomentum) strength += 15;
  if (analysis.patterns.priceAcceleration) strength += 10;
  if (direction === 'bullish') strength += 10;
  else if (direction === 'bearish') strength -= 10;
  
  strength = Math.max(0, Math.min(100, strength));
  
  // Expected Move
  const expectedMove = direction === 'bullish' 
    ? Math.max(0.5, avgMove * 1.2)
    : direction === 'bearish'
    ? Math.min(-0.5, avgMove * 1.2)
    : avgMove * 0.5;
  
  return {
    direction,
    strength: Math.round(strength),
    expectedMove: Math.round(expectedMove * 100) / 100,
    timeHorizon: 'morning_session',
  };
}

// Tarihsel Pattern Eslestirme
function matchHistoricalPatterns(
  bars: HistoricalBar[],
  lastBar: HistoricalBar
): PremarketPrediction['patternMatch'] {
  const lookbackDays = Math.min(60, bars.length);
  const recentBars = bars.slice(-lookbackDays);
  
  // Son 3 gunun pattern'i
  const lastPattern = {
    day1Green: recentBars.length >= 3 ? recentBars[recentBars.length - 3].close > recentBars[recentBars.length - 3].open : false,
    day2Green: recentBars.length >= 2 ? recentBars[recentBars.length - 2].close > recentBars[recentBars.length - 2].open : false,
    day3Green: lastBar.close > lastBar.open,
  };
  
  // Benzer pattern'leri bul
  let similarDays = 0;
  const outcomes: number[] = [];
  
  for (let i = 3; i < recentBars.length - 1; i++) {
    const pattern = {
      day1Green: recentBars[i - 2].close > recentBars[i - 2].open,
      day2Green: recentBars[i - 1].close > recentBars[i - 1].open,
      day3Green: recentBars[i].close > recentBars[i].open,
    };
    
    // Pattern eslesiyor mu
    if (
      pattern.day1Green === lastPattern.day1Green &&
      pattern.day2Green === lastPattern.day2Green &&
      pattern.day3Green === lastPattern.day3Green
    ) {
      similarDays++;
      // Ertesi gunun sonucu
      const nextDay = recentBars[i + 1];
      const outcome = ((nextDay.close - recentBars[i].close) / recentBars[i].close) * 100;
      outcomes.push(outcome);
    }
  }
  
  const avgOutcome = outcomes.length > 0 
    ? outcomes.reduce((a, b) => a + b, 0) / outcomes.length 
    : 0;
  
  const successRate = outcomes.length > 0
    ? (outcomes.filter(o => o > 0).length / outcomes.length) * 100
    : 50;
  
  const sortedOutcomes = [...outcomes].sort((a, b) => a - b);
  const bestCase = sortedOutcomes[sortedOutcomes.length - 1] || 2;
  const worstCase = sortedOutcomes[0] || -2;
  
  // Pattern ismi
  let matchedPattern = 'Tanimsiz';
  if (lastPattern.day1Green && lastPattern.day2Green && lastPattern.day3Green) {
    matchedPattern = '3 Gun Yesil Serisi';
  } else if (!lastPattern.day1Green && !lastPattern.day2Green && !lastPattern.day3Green) {
    matchedPattern = '3 Gun Kirmizi Serisi';
  } else if (!lastPattern.day1Green && !lastPattern.day2Green && lastPattern.day3Green) {
    matchedPattern = 'Dibi Donen';
  } else if (lastPattern.day1Green && lastPattern.day2Green && !lastPattern.day3Green) {
    matchedPattern = 'Momentum Kaybeden';
  } else if (lastPattern.day2Green && lastPattern.day3Green) {
    matchedPattern = '2 Gun Yesil';
  } else if (!lastPattern.day2Green && !lastPattern.day3Green) {
    matchedPattern = '2 Gun Kirmizi';
  } else {
    matchedPattern = 'Karisik Pattern';
  }
  
  return {
    similarDays,
    avgOutcome: Math.round(avgOutcome * 100) / 100,
    successRate: Math.round(successRate),
    bestCase: Math.round(bestCase * 100) / 100,
    worstCase: Math.round(worstCase * 100) / 100,
    matchedPattern,
  };
}

// Hacim Beklentisi
function predictVolume(
  bars: HistoricalBar[]
): PremarketPrediction['volumeExpectation'] {
  const avgVolume = bars.slice(-20).reduce((a, b) => a + b.volume, 0) / 20;
  const recentAvg = bars.slice(-5).reduce((a, b) => a + b.volume, 0) / 5;
  
  const expectedRatio = recentAvg / avgVolume;
  
  let significance: PremarketPrediction['volumeExpectation']['significance'] = 'normal';
  if (expectedRatio > 2) significance = 'very_high';
  else if (expectedRatio > 1.5) significance = 'high';
  else if (expectedRatio < 0.5) significance = 'low';
  
  return {
    expectedRatio: Math.round(expectedRatio * 100) / 100,
    significance,
  };
}

// Premarket Risk Hesaplama
function calculatePremarketRisk(
  gap: PremarketPrediction['predictedGap'],
  momentum: PremarketPrediction['momentumForecast'],
  analysis: ExtendedMorningGreenAnalysis
): PremarketPrediction['premarketRisk'] {
  let score = 30; // Baslangic
  const warnings: string[] = [];
  
  // Gap belirsizligi
  if (gap.range.max - gap.range.min > 2) {
    score += 20;
    warnings.push('Yuksek gap belirsizligi');
  }
  
  // Dusuk confidence
  if (gap.confidence < 50) {
    score += 15;
    warnings.push('Dusuk tahmin guveni');
  }
  
  // Hot streak yorgunlugu
  if (analysis.hotStreak.active && analysis.hotStreak.currentStreak > 5) {
    score += 25;
    warnings.push('Uzun streak - yorgunluk riski');
  }
  
  // Hacim dusuk
  if (analysis.volumePriceCorrelation.correlationStrength === 'weak') {
    score += 10;
    warnings.push('Hacim-fiyat korelasyonu zayif');
  }
  
  // 17:45 guvenilirligi dusuk
  if (analysis.afternoonAnalysis.greenCloseReliability < 40) {
    score += 15;
    warnings.push('Dusuk 17:45 guvenilirligi');
  }
  
  // Ters momentum
  if (momentum.direction === 'bearish' && gap.direction === 'up') {
    score += 20;
    warnings.push('Gap-momentum uyumsuzlugu');
  }
  
  score = Math.max(0, Math.min(100, score));
  
  let level: PremarketPrediction['premarketRisk']['level'] = 'medium';
  if (score < 30) level = 'low';
  else if (score > 60) level = 'high';
  
  return {
    score: Math.round(score),
    level,
    warnings,
  };
}

// Premarket Strateji Onerisi
function generatePremarketStrategy(
  gap: PremarketPrediction['predictedGap'],
  momentum: PremarketPrediction['momentumForecast'],
  pattern: PremarketPrediction['patternMatch'],
  risk: PremarketPrediction['premarketRisk'],
  currentPrice: number,
  analysis: ExtendedMorningGreenAnalysis
): PremarketPrediction['strategy'] {
  const reasoning: string[] = [];
  let action: PremarketPrediction['strategy']['action'] = 'WAIT_PULLBACK';
  
  // Mukemmel setup: Yuksek confidence + dusuk risk + bullish momentum
  if (
    gap.confidence >= 70 &&
    gap.direction === 'up' &&
    momentum.direction === 'bullish' &&
    risk.level === 'low' &&
    analysis.hotStreak.active
  ) {
    action = 'PREMARKET_BUY';
    reasoning.push(
      'MUKEMMEL SABAH SETUP!',
      `Gap tahmini: +%${gap.percent} (Guven: %${gap.confidence})`,
      `Hot Streak: ${analysis.hotStreak.currentStreak} gun`,
      `Risk: ${risk.level.toUpperCase()}`,
      `Pattern: ${pattern.matchedPattern} (Basari: %${pattern.successRate})`
    );
  }
  // Iyi setup: Orta-yuksek confidence + bullish
  else if (
    gap.confidence >= 55 &&
    gap.direction === 'up' &&
    momentum.direction !== 'bearish' &&
    risk.level !== 'high'
  ) {
    action = 'OPEN_BUY';
    reasoning.push(
      'Iyi sabah potansiyeli',
      `Gap tahmini: +%${gap.percent}`,
      `Momentum: ${momentum.direction}`,
      `Acilista giris onerilir`
    );
  }
  // Riskli setup: Bekle
  else if (risk.level === 'high' || gap.confidence < 45) {
    action = 'AVOID';
    reasoning.push(
      'Yuksek risk - sabah islemi onerilmez',
      ...risk.warnings.slice(0, 3)
    );
  }
  // Orta setup: Pullback bekle
  else {
    action = 'WAIT_PULLBACK';
    reasoning.push(
      'Orta seviye potansiyel',
      'Ilk dususte giris onerilir',
      `Beklenen gap: %${gap.percent}`
    );
  }
  
  // Entry, SL, TP hesaplama
  let entryPrice: number | undefined;
  let stopLoss: number | undefined;
  let target1: number | undefined;
  let target2: number | undefined;
  
  if (action !== 'AVOID') {
    const expectedGapPrice = currentPrice * (1 + gap.percent / 100);
    
    if (action === 'PREMARKET_BUY') {
      entryPrice = currentPrice * 0.995; // %0.5 altinda
      stopLoss = currentPrice * 0.97; // %3 stop
      target1 = expectedGapPrice * 1.01; // Gap + %1
      target2 = expectedGapPrice * 1.02; // Gap + %2
    } else if (action === 'OPEN_BUY') {
      entryPrice = expectedGapPrice;
      stopLoss = expectedGapPrice * 0.97;
      target1 = expectedGapPrice * 1.015;
      target2 = expectedGapPrice * 1.025;
    } else { // WAIT_PULLBACK
      entryPrice = expectedGapPrice * 0.99; // Pullback %1
      stopLoss = expectedGapPrice * 0.965;
      target1 = expectedGapPrice * 1.01;
      target2 = expectedGapPrice * 1.02;
    }
  }
  
  return {
    action,
    entryPrice: entryPrice ? Math.round(entryPrice * 100) / 100 : undefined,
    stopLoss: stopLoss ? Math.round(stopLoss * 100) / 100 : undefined,
    target1: target1 ? Math.round(target1 * 100) / 100 : undefined,
    target2: target2 ? Math.round(target2 * 100) / 100 : undefined,
    reasoning,
  };
}

// Default Premarket Prediction
function getDefaultPremarketPrediction(symbol: string): PremarketPrediction {
  return {
    symbol,
    predictedGap: {
      percent: 0,
      direction: 'flat',
      confidence: 30,
      range: { min: -1, max: 1 },
    },
    momentumForecast: {
      direction: 'neutral',
      strength: 50,
      expectedMove: 0,
      timeHorizon: 'morning_session',
    },
    patternMatch: {
      similarDays: 0,
      avgOutcome: 0,
      successRate: 50,
      bestCase: 0,
      worstCase: 0,
      matchedPattern: 'Yetersiz Veri',
    },
    volumeExpectation: {
      expectedRatio: 1,
      significance: 'normal',
    },
    premarketRisk: {
      score: 50,
      level: 'medium',
      warnings: ['Yetersiz veri'],
    },
    strategy: {
      action: 'AVOID',
      reasoning: ['Yetersiz veri - analiz yapilamiyor'],
    },
    lastUpdated: new Date(),
  };
}

// ==========================================
// SABAH TARAMASI - ANA FONKSIYON
// ==========================================

export interface MorningScanOptions {
  minMorningScore?: number; // Min sabah skoru (default: 60)
  minConfidence?: number; // Min guven (default: 55)
  onlyHotStreak?: boolean; // Sadece hot streak hisseler
  maxRisk?: 'low' | 'medium' | 'high'; // Max risk seviyesi
  minAfternoonReliability?: number; // Min 17:45 guvenilirligi
}

export function runMorningScan(
  stocks: { symbol: string; name: string; bars: HistoricalBar[]; currentPrice: number }[],
  options: MorningScanOptions = {}
): {
  topMorningPicks: MorningScanResult[];
  hotStreakStocks: HotStreakStock[];
  statistics: {
    totalScanned: number;
    passedFilters: number;
    avgMorningScore: number;
    avgConfidence: number;
    hotStreakCount: number;
  };
} {
  const {
    minMorningScore = 60,
    minConfidence = 55,
    onlyHotStreak = false,
    maxRisk = 'medium',
    minAfternoonReliability = 45,
  } = options;
  
  const results: MorningScanResult[] = [];
  
  // Hot streak hisselerini bul
  const hotStreakStocks = findHotStreakStocks(stocks);
  const hotStreakSymbols = new Set(hotStreakStocks.map(s => s.symbol));
  
  for (const stock of stocks) {
    if (stock.bars.length < 20) continue;
    
    // Gelismis sabah analizi
    const extendedMorning = analyzeExtendedMorningGreen(
      stock.bars, 
      stock.currentPrice,
      stock.symbol
    );
    
    // Premarket tahmini
    const premarketPrediction = generatePremarketPrediction(
      stock.symbol,
      stock.bars,
      stock.currentPrice,
      extendedMorning
    );
    
    // Sabah skoru hesaplama
    const morningScore = calculateMorningScore(extendedMorning, premarketPrediction);
    
    // Filtreleme
    if (morningScore.total < minMorningScore) continue;
    if (extendedMorning.aiPrediction.confidence < minConfidence) continue;
    if (extendedMorning.afternoonAnalysis.todayPrediction.tomorrowGreenProbability < minAfternoonReliability) continue;
    if (onlyHotStreak && !hotStreakSymbols.has(stock.symbol)) continue;
    
    // Risk kontrolu
    const riskOk = maxRisk === 'high' || 
      (maxRisk === 'medium' && premarketPrediction.premarketRisk.level !== 'high') ||
      (maxRisk === 'low' && premarketPrediction.premarketRisk.level === 'low');
    
    if (!riskOk) continue;
    
    // Strateji olustur
    const morningStrategy = generateMorningStrategy(
      extendedMorning,
      premarketPrediction,
      morningScore,
      stock.currentPrice
    );
    
    // Hot streak bilgisi ekle
    const hotStreak = hotStreakStocks.find(h => h.symbol === stock.symbol);
    
    // Sonuc olustur (kısmi - tam EliteScanResult degil)
    results.push({
      symbol: stock.symbol,
      name: stock.name,
      extendedMorningGreen: extendedMorning,
      premarketPrediction,
      confluence: calculateConfluenceScore([]), // Sinyaller sonra eklenecek
      hotStreak,
      morningScore,
      morningStrategy,
    } as MorningScanResult);
  }
  
  // Sabah skoruna gore sirala
  results.sort((a, b) => b.morningScore.total - a.morningScore.total);
  
  // Istatistikler
  const statistics = {
    totalScanned: stocks.length,
    passedFilters: results.length,
    avgMorningScore: results.length > 0 
      ? Math.round(results.reduce((a, b) => a + b.morningScore.total, 0) / results.length)
      : 0,
    avgConfidence: results.length > 0
      ? Math.round(results.reduce((a, b) => a + b.extendedMorningGreen.aiPrediction.confidence, 0) / results.length)
      : 0,
    hotStreakCount: hotStreakStocks.length,
  };
  
  return {
    topMorningPicks: results.slice(0, 20), // Top 20
    hotStreakStocks,
    statistics,
  };
}

// Sabah Skoru Hesaplama
function calculateMorningScore(
  analysis: ExtendedMorningGreenAnalysis,
  prediction: PremarketPrediction
): MorningScanResult['morningScore'] {
  // Green History (max 30)
  const greenHistory = Math.min(30, analysis.stats.greenMorningRate5d * 0.3);
  
  // Afternoon Reliability (max 25)
  const afternoonReliability = Math.min(25, 
    analysis.afternoonAnalysis.todayPrediction.tomorrowGreenProbability * 0.25
  );
  
  // Gap Follow-Through (max 20)
  const gapFollowThrough = Math.min(20, 
    analysis.gapFollowThrough.gapUpFollowThroughRate * 0.2
  );
  
  // Hot Streak Bonus (max 15)
  let hotStreakBonus = 0;
  if (analysis.hotStreak.active) {
    hotStreakBonus = Math.min(15, 
      analysis.hotStreak.currentStreak * 3 + 
      (analysis.hotStreak.momentumAcceleration ? 5 : 0)
    );
  }
  
  // Confluence Bonus (max 10)
  const confluenceBonus = Math.min(10,
    (prediction.momentumForecast.strength / 100) * 5 +
    (prediction.predictedGap.confidence / 100) * 5
  );
  
  const total = Math.round(
    greenHistory + 
    afternoonReliability + 
    gapFollowThrough + 
    hotStreakBonus + 
    confluenceBonus
  );
  
  // Grade belirleme
  let grade: MorningScanResult['morningScore']['grade'] = 'F';
  if (total >= 85) grade = 'S';
  else if (total >= 75) grade = 'A';
  else if (total >= 65) grade = 'B';
  else if (total >= 55) grade = 'C';
  else if (total >= 45) grade = 'D';
  
  return {
    total,
    breakdown: {
      greenHistory: Math.round(greenHistory),
      afternoonReliability: Math.round(afternoonReliability),
      gapFollowThrough: Math.round(gapFollowThrough),
      hotStreakBonus: Math.round(hotStreakBonus),
      confluenceBonus: Math.round(confluenceBonus),
    },
    grade,
  };
}

// Sabah Stratejisi Olustur
function generateMorningStrategy(
  analysis: ExtendedMorningGreenAnalysis,
  prediction: PremarketPrediction,
  score: MorningScanResult['morningScore'],
  currentPrice: number
): MorningScanResult['morningStrategy'] {
  const reasoning: string[] = [];
  let action: MorningScanResult['morningStrategy']['action'] = 'WAIT_FOR_DIP';
  let entryTiming: MorningScanResult['morningStrategy']['entryTiming'] = 'FIRST_PULLBACK';
  
  // S veya A grade + yuksek confidence = STRONG_MORNING_BUY
  if (
    (score.grade === 'S' || score.grade === 'A') &&
    analysis.aiPrediction.confidence >= 70 &&
    analysis.hotStreak.active
  ) {
    action = 'STRONG_MORNING_BUY';
    entryTiming = 'PREMARKET';
    reasoning.push(
      `MUKEMMEL SABAH FIRSATI! Grade: ${score.grade}`,
      `Sabah Skoru: ${score.total}/100`,
      `AI Guven: %${analysis.aiPrediction.confidence}`,
      `Hot Streak: ${analysis.hotStreak.currentStreak} gun`,
      `Yarin Yesil Olasiligi: %${analysis.aiPrediction.tomorrowGreenProbability}`
    );
  }
  // B grade + iyi confidence = MORNING_BUY
  else if (
    (score.grade === 'A' || score.grade === 'B') &&
    analysis.aiPrediction.confidence >= 55
  ) {
    action = 'MORNING_BUY';
    entryTiming = 'OPEN';
    reasoning.push(
      `Iyi sabah potansiyeli. Grade: ${score.grade}`,
      `Sabah Skoru: ${score.total}/100`,
      `Yarin Yesil Olasiligi: %${analysis.aiPrediction.tomorrowGreenProbability}`,
      `Acilista giris onerilir`
    );
  }
  // C grade = WAIT_FOR_DIP
  else if (score.grade === 'C') {
    action = 'WAIT_FOR_DIP';
    entryTiming = 'FIRST_PULLBACK';
    reasoning.push(
      `Orta seviye potansiyel. Grade: ${score.grade}`,
      `Ilk dipi bekleyin`,
      `Sabah Skoru: ${score.total}/100`
    );
  }
  // D veya F grade = DAY_TRADE_ONLY veya AVOID
  else {
    if (prediction.premarketRisk.level === 'high') {
      action = 'AVOID';
      reasoning.push(
        `Dusuk potansiyel + yuksek risk`,
        ...prediction.premarketRisk.warnings.slice(0, 2)
      );
    } else {
      action = 'DAY_TRADE_ONLY';
      entryTiming = 'BREAKOUT';
      reasoning.push(
        `Dusuk sabah potansiyeli`,
        `Sadece gun ici breakout firsati aranabilir`
      );
    }
  }
  
  // Stop loss ve target hesaplama
  const expectedGap = analysis.aiPrediction.tomorrowExpectedGap;
  const entryPrice = action === 'STRONG_MORNING_BUY' 
    ? currentPrice * 0.995 
    : currentPrice * (1 + expectedGap / 100);
  
  const stopLoss = entryPrice * 0.97; // %3 stop
  const target1 = entryPrice * 1.02; // %2 hedef
  const target2 = action === 'STRONG_MORNING_BUY' ? entryPrice * 1.04 : undefined;
  
  const riskReward = ((target1 - entryPrice) / (entryPrice - stopLoss));
  
  return {
    action,
    entryTiming,
    entryPrice: action !== 'AVOID' ? Math.round(entryPrice * 100) / 100 : undefined,
    stopLoss: Math.round(stopLoss * 100) / 100,
    target1: Math.round(target1 * 100) / 100,
    target2: target2 ? Math.round(target2 * 100) / 100 : undefined,
    riskReward: Math.round(riskReward * 100) / 100,
    confidence: analysis.aiPrediction.confidence,
    reasoning,
  };
}
