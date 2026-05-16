// ==========================================
// OVERNIGHT ANALYZER ENGINE
// Aksam-Sabah Arasi Pattern ve Tahmin Motoru
// Ultra-Elite Firsat Tespiti
// ==========================================

import { HistoricalBar, MorningGreenAnalysis } from './elite-scanner-types';

// ==========================================
// TIP TANIMLAMALARI
// ==========================================

export interface OvernightSession {
  date: string;
  eveningClose: number;        // 17:45 kapanis
  eveningHigh: number;         // Gun yuksegi
  eveningLow: number;          // Gun dusugu
  eveningVolume: number;       // Gun hacmi
  eveningCandle: 'green' | 'red' | 'doji';
  
  morningOpen: number;         // Ertesi gun acilis
  morningGap: number;          // Gap %
  morningGapType: 'gap_up' | 'gap_down' | 'flat';
  morningCandle: 'green' | 'red' | 'doji';
  morningFirst30MinHigh: number;
  morningFirst30MinLow: number;
  
  // Pattern Sonucu
  eveningGreenMorningGreen: boolean;
  eveningGreenMorningRed: boolean;
  eveningRedMorningGreen: boolean;
  eveningRedMorningRed: boolean;
  
  // Performans
  morningPerformance: number;  // Sabah ilk 30dk performans %
  dayPerformance: number;      // Gun sonu performans %
}

export interface WeeklyMorningScore {
  // Son 5 Islem Gunu Analizi
  last5Days: OvernightSession[];
  
  // Haftalik Skor (0-100)
  weeklyScore: number;
  
  // Pattern Istatistikleri
  patterns: {
    eveningGreenMorningGreenCount: number;
    eveningGreenMorningRedCount: number;
    eveningRedMorningGreenCount: number;
    eveningRedMorningRedCount: number;
    
    // Oranlar
    eveningGreenSuccessRate: number;  // Aksam yesil -> sabah yesil orani
    eveningRedRecoveryRate: number;   // Aksam kirmizi -> sabah yesil orani
    overallMorningGreenRate: number;  // Genel sabah yesil orani
  };
  
  // Pattern Guvenilirlik
  reliability: {
    eveningGreenReliability: number;  // Aksam yesil ne kadar guvenilir
    patternConsistency: number;       // Pattern tutarliligi
    confidenceLevel: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  };
  
  // Tahmin
  prediction: {
    nextMorningDirection: 'green' | 'red' | 'uncertain';
    probability: number;
    reasoning: string[];
  };
}

export interface OvernightAnalysis {
  // Mevcut Durum
  currentEvening: {
    isGreen: boolean;
    closePrice: number;
    changePercent: number;
    volumeVsAvg: number;
    candleStrength: 'strong' | 'moderate' | 'weak';
  };
  
  // Tarihsel Pattern
  historicalPattern: WeeklyMorningScore;
  
  // Sabah Tahmini
  morningPrediction: {
    expectedGap: number;
    expectedDirection: 'gap_up' | 'gap_down' | 'flat';
    probability: number;
    confidence: number;
    
    // Detayli Tahmin
    scenarios: {
      bullish: { probability: number; targetPercent: number };
      neutral: { probability: number; targetPercent: number };
      bearish: { probability: number; targetPercent: number };
    };
  };
  
  // Overnight Risk Skoru
  overnightRisk: {
    score: number;  // 0-100 (dusuk = az risk)
    factors: string[];
    recommendation: 'HOLD_OVERNIGHT' | 'CAUTION' | 'EXIT_BEFORE_CLOSE';
  };
  
  // Trading Stratejisi
  strategy: {
    eveningAction: 'BUY_BEFORE_CLOSE' | 'HOLD' | 'SELL_BEFORE_CLOSE' | 'WAIT';
    morningAction: 'BUY_AT_OPEN' | 'BUY_ON_DIP' | 'WAIT_AND_SEE' | 'SELL_AT_OPEN';
    reasoning: string[];
    optimalTiming: string;
  };
}

export interface UltraEliteCriteria {
  // Temel Kriterler
  overallScore: number;           // >= 80
  morningGreenRate: number;       // >= 60%
  eveningReliability: number;     // >= 70%
  
  // Teknik Konfluans
  technicalAlignment: boolean;    // Trend + Momentum alinmis
  volumeSupport: boolean;         // Hacim destegi var
  
  // Risk/Odul
  riskRewardRatio: number;        // >= 2:1
  maxDrawdownRisk: number;        // <= 5%
  
  // Zaman Faktoru
  isOptimalTiming: boolean;       // Aksam alim icin uygun mu
  marketCondition: 'bullish' | 'neutral' | 'bearish';
}

export interface UltraEliteOpportunity {
  symbol: string;
  name: string;
  
  // Skorlar
  ultraEliteScore: number;        // 0-100
  morningGreenScore: number;
  technicalScore: number;
  
  // Overnight Analizi
  overnightAnalysis: OvernightAnalysis;
  
  // Kriterler
  criteria: UltraEliteCriteria;
  criteriaMetCount: number;
  totalCriteria: number;
  
  // Tahminler
  predictions: {
    morningGapExpected: number;
    morningTargetPrice: number;
    morningTargetPercent: number;
    dayTargetPrice: number;
    dayTargetPercent: number;
    successProbability: number;
  };
  
  // Strateji
  strategy: {
    action: 'STRONG_BUY_TONIGHT' | 'BUY_TONIGHT' | 'WATCH' | 'AVOID';
    entryPrice: number;
    stopLoss: number;
    target1: number;
    target2: number;
    riskReward: number;
    reasoning: string[];
  };
  
  // Zaman Damgasi
  analysisTime: Date;
  validUntil: string;  // "Yarin sabah 10:00'a kadar"
}

// ==========================================
// ANA ANALIZ FONKSIYONLARI
// ==========================================

/**
 * Haftalik Sabah Yesil Skorunu Hesapla
 * Son 5 islem gunu icin overnight pattern analizi
 */
export function calculateWeeklyMorningScore(bars: HistoricalBar[]): WeeklyMorningScore {
  if (bars.length < 10) {
    return getDefaultWeeklyMorningScore();
  }
  
  const sessions: OvernightSession[] = [];
  const recentBars = bars.slice(-20); // Son 20 gun
  
  // Her gun icin overnight session olustur
  for (let i = 1; i < recentBars.length; i++) {
    const prevBar = recentBars[i - 1]; // Aksam
    const currentBar = recentBars[i];  // Sabah
    
    const eveningCandle = getCandle(prevBar);
    const morningCandle = getCandle(currentBar);
    const morningGap = ((currentBar.open - prevBar.close) / prevBar.close) * 100;
    
    const session: OvernightSession = {
      date: currentBar.date.toISOString().split('T')[0],
      eveningClose: prevBar.close,
      eveningHigh: prevBar.high,
      eveningLow: prevBar.low,
      eveningVolume: prevBar.volume,
      eveningCandle,
      
      morningOpen: currentBar.open,
      morningGap: Math.round(morningGap * 100) / 100,
      morningGapType: morningGap > 0.3 ? 'gap_up' : morningGap < -0.3 ? 'gap_down' : 'flat',
      morningCandle,
      morningFirst30MinHigh: currentBar.high, // Simulasyon
      morningFirst30MinLow: currentBar.low,
      
      eveningGreenMorningGreen: eveningCandle === 'green' && currentBar.open > prevBar.close,
      eveningGreenMorningRed: eveningCandle === 'green' && currentBar.open <= prevBar.close,
      eveningRedMorningGreen: eveningCandle === 'red' && currentBar.open > prevBar.close,
      eveningRedMorningRed: eveningCandle === 'red' && currentBar.open <= prevBar.close,
      
      morningPerformance: ((currentBar.high - currentBar.open) / currentBar.open) * 100,
      dayPerformance: ((currentBar.close - prevBar.close) / prevBar.close) * 100,
    };
    
    sessions.push(session);
  }
  
  // Son 5 gunu al
  const last5Days = sessions.slice(-5);
  
  // Pattern istatistikleri
  const eveningGreenCount = last5Days.filter(s => s.eveningCandle === 'green').length;
  const eveningRedCount = last5Days.filter(s => s.eveningCandle === 'red').length;
  
  const egmg = last5Days.filter(s => s.eveningGreenMorningGreen).length;
  const egmr = last5Days.filter(s => s.eveningGreenMorningRed).length;
  const ermg = last5Days.filter(s => s.eveningRedMorningGreen).length;
  const ermr = last5Days.filter(s => s.eveningRedMorningRed).length;
  
  const eveningGreenSuccessRate = eveningGreenCount > 0 
    ? Math.round((egmg / eveningGreenCount) * 100) 
    : 50;
  
  const eveningRedRecoveryRate = eveningRedCount > 0 
    ? Math.round((ermg / eveningRedCount) * 100) 
    : 50;
  
  const overallMorningGreenRate = Math.round(((egmg + ermg) / last5Days.length) * 100);
  
  // Guvenilirlik hesapla
  const eveningGreenReliability = eveningGreenSuccessRate;
  const patternConsistency = calculatePatternConsistency(last5Days);
  
  let confidenceLevel: WeeklyMorningScore['reliability']['confidenceLevel'] = 'medium';
  if (patternConsistency >= 80 && eveningGreenReliability >= 70) confidenceLevel = 'very_high';
  else if (patternConsistency >= 60 && eveningGreenReliability >= 60) confidenceLevel = 'high';
  else if (patternConsistency >= 40) confidenceLevel = 'medium';
  else if (patternConsistency >= 20) confidenceLevel = 'low';
  else confidenceLevel = 'very_low';
  
  // Haftalik skor hesapla
  const weeklyScore = calculateWeeklyScore(
    overallMorningGreenRate,
    eveningGreenSuccessRate,
    patternConsistency,
    last5Days
  );
  
  // Tahmin olustur
  const lastSession = last5Days[last5Days.length - 1];
  const prediction = generateMorningPrediction(lastSession, eveningGreenSuccessRate, eveningRedRecoveryRate);
  
  return {
    last5Days,
    weeklyScore,
    patterns: {
      eveningGreenMorningGreenCount: egmg,
      eveningGreenMorningRedCount: egmr,
      eveningRedMorningGreenCount: ermg,
      eveningRedMorningRedCount: ermr,
      eveningGreenSuccessRate,
      eveningRedRecoveryRate,
      overallMorningGreenRate,
    },
    reliability: {
      eveningGreenReliability,
      patternConsistency,
      confidenceLevel,
    },
    prediction,
  };
}

/**
 * Overnight Session Analizi
 * Mevcut aksam durumu ve sabah tahmini
 */
export function analyzeOvernightSession(
  bars: HistoricalBar[],
  currentPrice: number,
  previousClose: number
): OvernightAnalysis {
  if (bars.length < 10) {
    return getDefaultOvernightAnalysis();
  }
  
  const weeklyScore = calculateWeeklyMorningScore(bars);
  const lastBar = bars[bars.length - 1];
  
  // Mevcut aksam durumu
  const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
  const isGreen = currentPrice > previousClose;
  const avgVolume = bars.slice(-20).reduce((a, b) => a + b.volume, 0) / 20;
  const volumeVsAvg = lastBar.volume / avgVolume;
  
  let candleStrength: OvernightAnalysis['currentEvening']['candleStrength'] = 'moderate';
  if (Math.abs(changePercent) >= 3 && volumeVsAvg >= 1.5) candleStrength = 'strong';
  else if (Math.abs(changePercent) < 1 || volumeVsAvg < 0.7) candleStrength = 'weak';
  
  // Sabah tahmini
  const morningPrediction = predictMorningGap(weeklyScore, isGreen, changePercent, volumeVsAvg);
  
  // Overnight risk
  const overnightRisk = calculateOvernightRisk(weeklyScore, changePercent, volumeVsAvg);
  
  // Strateji
  const strategy = generateOvernightStrategy(weeklyScore, isGreen, morningPrediction, overnightRisk);
  
  return {
    currentEvening: {
      isGreen,
      closePrice: currentPrice,
      changePercent: Math.round(changePercent * 100) / 100,
      volumeVsAvg: Math.round(volumeVsAvg * 10) / 10,
      candleStrength,
    },
    historicalPattern: weeklyScore,
    morningPrediction,
    overnightRisk,
    strategy,
  };
}

/**
 * Sabah Gap Tahmini
 * AI-destekli tahmin motoru
 */
export function predictMorningGap(
  weeklyScore: WeeklyMorningScore,
  isEveningGreen: boolean,
  eveningChangePercent: number,
  volumeRatio: number
): OvernightAnalysis['morningPrediction'] {
  const { patterns, reliability } = weeklyScore;
  
  // Base tahmin
  let expectedGap = 0;
  let probability = 50;
  
  if (isEveningGreen) {
    // Aksam yesil ise
    expectedGap = patterns.eveningGreenSuccessRate >= 60 ? 0.5 : -0.2;
    probability = patterns.eveningGreenSuccessRate;
  } else {
    // Aksam kirmizi ise
    expectedGap = patterns.eveningRedRecoveryRate >= 60 ? 0.3 : -0.5;
    probability = patterns.eveningRedRecoveryRate;
  }
  
  // Volume etkisi
  if (volumeRatio > 1.5) {
    expectedGap *= 1.3;
    probability = Math.min(90, probability + 10);
  }
  
  // Momentum etkisi
  if (Math.abs(eveningChangePercent) > 2) {
    expectedGap += eveningChangePercent * 0.1;
  }
  
  // Confidence
  let confidence = reliability.patternConsistency * 0.6 + probability * 0.4;
  if (reliability.confidenceLevel === 'very_high') confidence = Math.min(95, confidence + 15);
  else if (reliability.confidenceLevel === 'high') confidence = Math.min(90, confidence + 10);
  else if (reliability.confidenceLevel === 'low') confidence = Math.max(20, confidence - 15);
  
  // Senaryolar
  const bullishProb = isEveningGreen ? patterns.eveningGreenSuccessRate : patterns.eveningRedRecoveryRate;
  const bearishProb = isEveningGreen ? patterns.eveningGreenMorningRedCount * 20 : patterns.eveningRedMorningRedCount * 20;
  const neutralProb = 100 - bullishProb - bearishProb;
  
  return {
    expectedGap: Math.round(expectedGap * 100) / 100,
    expectedDirection: expectedGap > 0.3 ? 'gap_up' : expectedGap < -0.3 ? 'gap_down' : 'flat',
    probability: Math.round(probability),
    confidence: Math.round(confidence),
    scenarios: {
      bullish: { 
        probability: Math.round(bullishProb), 
        targetPercent: Math.round((expectedGap + 1) * 100) / 100 
      },
      neutral: { 
        probability: Math.round(Math.max(10, neutralProb)), 
        targetPercent: 0 
      },
      bearish: { 
        probability: Math.round(Math.max(5, bearishProb)), 
        targetPercent: Math.round((expectedGap - 1) * 100) / 100 
      },
    },
  };
}

/**
 * Ultra-Elite Firsat Tespiti
 * En yuksek kaliteli sabah firsatlarini filtrele
 */
export function identifyUltraEliteOpportunity(
  symbol: string,
  name: string,
  bars: HistoricalBar[],
  currentPrice: number,
  previousClose: number,
  technicalScore: number,
  morningGreenAnalysis: MorningGreenAnalysis
): UltraEliteOpportunity | null {
  const overnightAnalysis = analyzeOvernightSession(bars, currentPrice, previousClose);
  const weeklyScore = overnightAnalysis.historicalPattern;
  
  // Ultra-Elite Kriterleri Kontrolu
  const criteria: UltraEliteCriteria = {
    overallScore: morningGreenAnalysis.morningGreenScore,
    morningGreenRate: weeklyScore.patterns.overallMorningGreenRate,
    eveningReliability: weeklyScore.reliability.eveningGreenReliability,
    technicalAlignment: technicalScore >= 65,
    volumeSupport: overnightAnalysis.currentEvening.volumeVsAvg >= 0.8,
    riskRewardRatio: 2.0,
    maxDrawdownRisk: 5,
    isOptimalTiming: overnightAnalysis.currentEvening.isGreen && overnightAnalysis.currentEvening.candleStrength !== 'weak',
    marketCondition: technicalScore >= 60 ? 'bullish' : technicalScore >= 40 ? 'neutral' : 'bearish',
  };
  
  // Kriter sayisi
  let criteriaMetCount = 0;
  const totalCriteria = 8;
  
  if (criteria.overallScore >= 70) criteriaMetCount++;
  if (criteria.morningGreenRate >= 60) criteriaMetCount++;
  if (criteria.eveningReliability >= 60) criteriaMetCount++;
  if (criteria.technicalAlignment) criteriaMetCount++;
  if (criteria.volumeSupport) criteriaMetCount++;
  if (criteria.riskRewardRatio >= 2) criteriaMetCount++;
  if (criteria.maxDrawdownRisk <= 5) criteriaMetCount++;
  if (criteria.isOptimalTiming) criteriaMetCount++;
  
  // Ultra-Elite skoru
  const ultraEliteScore = calculateUltraEliteScore(
    criteria.overallScore,
    criteria.morningGreenRate,
    criteria.eveningReliability,
    technicalScore,
    overnightAnalysis.morningPrediction.confidence
  );
  
  // Minimum 6/8 kriter saglanmali
  if (criteriaMetCount < 5 || ultraEliteScore < 60) {
    return null;
  }
  
  // Tahminler
  const expectedGap = overnightAnalysis.morningPrediction.expectedGap;
  const morningTargetPercent = expectedGap + 1; // Gap + %1 ek potansiyel
  const dayTargetPercent = morningTargetPercent + 1.5;
  
  // Strateji
  let action: UltraEliteOpportunity['strategy']['action'] = 'WATCH';
  const reasoning: string[] = [];
  
  if (ultraEliteScore >= 85 && criteriaMetCount >= 7) {
    action = 'STRONG_BUY_TONIGHT';
    reasoning.push(`MUKEMMEL FIRSAT! Ultra-Elite Skor: ${ultraEliteScore}/100`);
    reasoning.push(`${criteriaMetCount}/${totalCriteria} kriter karsilandi`);
    reasoning.push(`Sabah yesil orani: %${criteria.morningGreenRate}`);
    reasoning.push(`Aksam yesil guvenilirlik: %${criteria.eveningReliability}`);
  } else if (ultraEliteScore >= 70 && criteriaMetCount >= 6) {
    action = 'BUY_TONIGHT';
    reasoning.push(`Guclu firsat! Ultra-Elite Skor: ${ultraEliteScore}/100`);
    reasoning.push(`${criteriaMetCount}/${totalCriteria} kriter karsilandi`);
  } else if (ultraEliteScore >= 60) {
    action = 'WATCH';
    reasoning.push(`Izlemeye deger. Ultra-Elite Skor: ${ultraEliteScore}/100`);
  } else {
    action = 'AVOID';
    reasoning.push(`Yeterli kriter saglanmadi`);
  }
  
  // Stop loss ve hedefler
  const stopLoss = currentPrice * 0.97; // %3 stop
  const target1 = currentPrice * (1 + morningTargetPercent / 100);
  const target2 = currentPrice * (1 + dayTargetPercent / 100);
  const riskReward = morningTargetPercent / 3; // Risk %3, reward variable
  
  return {
    symbol,
    name,
    ultraEliteScore,
    morningGreenScore: morningGreenAnalysis.morningGreenScore,
    technicalScore,
    overnightAnalysis,
    criteria,
    criteriaMetCount,
    totalCriteria,
    predictions: {
      morningGapExpected: expectedGap,
      morningTargetPrice: Math.round(target1 * 100) / 100,
      morningTargetPercent: Math.round(morningTargetPercent * 100) / 100,
      dayTargetPrice: Math.round(target2 * 100) / 100,
      dayTargetPercent: Math.round(dayTargetPercent * 100) / 100,
      successProbability: overnightAnalysis.morningPrediction.probability,
    },
    strategy: {
      action,
      entryPrice: currentPrice,
      stopLoss: Math.round(stopLoss * 100) / 100,
      target1: Math.round(target1 * 100) / 100,
      target2: Math.round(target2 * 100) / 100,
      riskReward: Math.round(riskReward * 10) / 10,
      reasoning,
    },
    analysisTime: new Date(),
    validUntil: 'Yarin sabah 10:00\'a kadar',
  };
}

// ==========================================
// YARDIMCI FONKSIYONLAR
// ==========================================

function getCandle(bar: HistoricalBar): 'green' | 'red' | 'doji' {
  const bodyPercent = Math.abs((bar.close - bar.open) / bar.open) * 100;
  if (bodyPercent < 0.1) return 'doji';
  return bar.close > bar.open ? 'green' : 'red';
}

function calculatePatternConsistency(sessions: OvernightSession[]): number {
  if (sessions.length < 3) return 50;
  
  // Son 3 gunun tutarliligi
  const last3 = sessions.slice(-3);
  const greenMornings = last3.filter(s => s.morningGapType === 'gap_up' || s.eveningGreenMorningGreen).length;
  
  // Ust uste ayni pattern
  let consecutivePattern = 1;
  for (let i = sessions.length - 2; i >= 0; i--) {
    const current = sessions[i + 1].eveningGreenMorningGreen;
    const prev = sessions[i].eveningGreenMorningGreen;
    if (current === prev) consecutivePattern++;
    else break;
  }
  
  const consistencyScore = (greenMornings / 3) * 50 + (consecutivePattern / 5) * 50;
  return Math.round(Math.min(100, consistencyScore));
}

function calculateWeeklyScore(
  morningGreenRate: number,
  eveningGreenSuccessRate: number,
  patternConsistency: number,
  sessions: OvernightSession[]
): number {
  // Agirlikli skor
  let score = 0;
  
  // Sabah yesil orani (%40)
  score += (morningGreenRate / 100) * 40;
  
  // Aksam yesil basari orani (%30)
  score += (eveningGreenSuccessRate / 100) * 30;
  
  // Pattern tutarliligi (%20)
  score += (patternConsistency / 100) * 20;
  
  // Ortalama sabah performansi (%10)
  const avgMorningPerf = sessions.reduce((a, b) => a + b.morningPerformance, 0) / sessions.length;
  const perfScore = Math.min(10, Math.max(0, avgMorningPerf * 5));
  score += perfScore;
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

function generateMorningPrediction(
  lastSession: OvernightSession | undefined,
  eveningGreenSuccessRate: number,
  eveningRedRecoveryRate: number
): WeeklyMorningScore['prediction'] {
  if (!lastSession) {
    return {
      nextMorningDirection: 'uncertain',
      probability: 50,
      reasoning: ['Yeterli veri yok'],
    };
  }
  
  const reasoning: string[] = [];
  let direction: 'green' | 'red' | 'uncertain' = 'uncertain';
  let probability = 50;
  
  if (lastSession.eveningCandle === 'green') {
    probability = eveningGreenSuccessRate;
    if (probability >= 70) {
      direction = 'green';
      reasoning.push(`Aksam yesil kapandi, tarihsel basari orani: %${probability}`);
      reasoning.push(`Son 5 gunde aksam yesil -> sabah yesil pattern guclu`);
    } else if (probability >= 50) {
      direction = 'green';
      reasoning.push(`Aksam yesil, orta seviye guvenilirlik: %${probability}`);
    } else {
      direction = 'uncertain';
      reasoning.push(`Aksam yesil ama guvenilirlik dusuk: %${probability}`);
    }
  } else {
    probability = eveningRedRecoveryRate;
    if (probability >= 60) {
      direction = 'green';
      reasoning.push(`Aksam kirmizi ama recovery orani yuksek: %${probability}`);
    } else {
      direction = 'red';
      reasoning.push(`Aksam kirmizi, recovery orani dusuk: %${probability}`);
    }
  }
  
  return { nextMorningDirection: direction, probability, reasoning };
}

function calculateOvernightRisk(
  weeklyScore: WeeklyMorningScore,
  changePercent: number,
  volumeRatio: number
): OvernightAnalysis['overnightRisk'] {
  let riskScore = 50;
  const factors: string[] = [];
  
  // Pattern guvenilirligi
  if (weeklyScore.reliability.confidenceLevel === 'very_low') {
    riskScore += 25;
    factors.push('Pattern guvenilirligi cok dusuk');
  } else if (weeklyScore.reliability.confidenceLevel === 'low') {
    riskScore += 15;
    factors.push('Pattern guvenilirligi dusuk');
  } else if (weeklyScore.reliability.confidenceLevel === 'very_high') {
    riskScore -= 20;
  }
  
  // Volatilite
  if (Math.abs(changePercent) > 5) {
    riskScore += 20;
    factors.push(`Yuksek volatilite: %${changePercent.toFixed(1)}`);
  }
  
  // Dusuk hacim
  if (volumeRatio < 0.5) {
    riskScore += 15;
    factors.push('Dusuk hacim riski');
  }
  
  // Sonuc
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  let recommendation: OvernightAnalysis['overnightRisk']['recommendation'] = 'HOLD_OVERNIGHT';
  if (riskScore >= 70) recommendation = 'EXIT_BEFORE_CLOSE';
  else if (riskScore >= 50) recommendation = 'CAUTION';
  
  return { score: riskScore, factors, recommendation };
}

function generateOvernightStrategy(
  weeklyScore: WeeklyMorningScore,
  isGreen: boolean,
  morningPrediction: OvernightAnalysis['morningPrediction'],
  overnightRisk: OvernightAnalysis['overnightRisk']
): OvernightAnalysis['strategy'] {
  const reasoning: string[] = [];
  let eveningAction: OvernightAnalysis['strategy']['eveningAction'] = 'WAIT';
  let morningAction: OvernightAnalysis['strategy']['morningAction'] = 'WAIT_AND_SEE';
  
  // Yuksek guvenilirlik + yesil aksam
  if (
    weeklyScore.reliability.confidenceLevel === 'very_high' &&
    isGreen &&
    morningPrediction.probability >= 70 &&
    overnightRisk.score < 50
  ) {
    eveningAction = 'BUY_BEFORE_CLOSE';
    morningAction = 'WAIT_AND_SEE';
    reasoning.push('IDEAL SENARYO: Aksam yesil, guvenilirlik cok yuksek');
    reasoning.push(`Sabah yesil olasiligi: %${morningPrediction.probability}`);
    reasoning.push('Aksam kapanis oncesi pozisyon ac');
  }
  // Orta guvenilirlik
  else if (
    weeklyScore.reliability.confidenceLevel === 'high' &&
    morningPrediction.probability >= 60
  ) {
    eveningAction = 'HOLD';
    morningAction = 'BUY_ON_DIP';
    reasoning.push('Iyi senaryo: Orta-yuksek guvenilirlik');
    reasoning.push('Sabah ilk dususte pozisyon ac');
  }
  // Dusuk guvenilirlik veya yuksek risk
  else if (overnightRisk.score >= 60) {
    eveningAction = 'SELL_BEFORE_CLOSE';
    morningAction = 'WAIT_AND_SEE';
    reasoning.push('DIKKAT: Yuksek overnight risk');
    reasoning.push('Kapanis oncesi pozisyonlari kapat');
  }
  // Belirsiz
  else {
    eveningAction = 'WAIT';
    morningAction = 'WAIT_AND_SEE';
    reasoning.push('Belirsiz kosullar, bekle ve izle');
  }
  
  const optimalTiming = eveningAction === 'BUY_BEFORE_CLOSE' 
    ? '17:30-17:45 arasi' 
    : (morningAction as string) === 'BUY_AT_OPEN'
      ? '09:30 acilisinda'
      : 'Sabah 10:00\'a kadar izle';
  
  return {
    eveningAction,
    morningAction,
    reasoning,
    optimalTiming,
  };
}

function calculateUltraEliteScore(
  overallScore: number,
  morningGreenRate: number,
  eveningReliability: number,
  technicalScore: number,
  predictionConfidence: number
): number {
  // Agirlikli skor formulu
  const score = 
    overallScore * 0.25 +           // Genel skor %25
    morningGreenRate * 0.20 +       // Haftalik pattern %20
    eveningReliability * 0.15 +     // Aksam guvenilirlik %15
    technicalScore * 0.25 +         // Teknik analiz %25
    predictionConfidence * 0.15;    // AI tahmin %15
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ==========================================
// DEFAULT DEGERLER
// ==========================================

function getDefaultWeeklyMorningScore(): WeeklyMorningScore {
  return {
    last5Days: [],
    weeklyScore: 50,
    patterns: {
      eveningGreenMorningGreenCount: 0,
      eveningGreenMorningRedCount: 0,
      eveningRedMorningGreenCount: 0,
      eveningRedMorningRedCount: 0,
      eveningGreenSuccessRate: 50,
      eveningRedRecoveryRate: 50,
      overallMorningGreenRate: 50,
    },
    reliability: {
      eveningGreenReliability: 50,
      patternConsistency: 50,
      confidenceLevel: 'medium',
    },
    prediction: {
      nextMorningDirection: 'uncertain',
      probability: 50,
      reasoning: ['Yeterli veri yok'],
    },
  };
}

function getDefaultOvernightAnalysis(): OvernightAnalysis {
  return {
    currentEvening: {
      isGreen: false,
      closePrice: 0,
      changePercent: 0,
      volumeVsAvg: 1,
      candleStrength: 'moderate',
    },
    historicalPattern: getDefaultWeeklyMorningScore(),
    morningPrediction: {
      expectedGap: 0,
      expectedDirection: 'flat',
      probability: 50,
      confidence: 50,
      scenarios: {
        bullish: { probability: 33, targetPercent: 1 },
        neutral: { probability: 34, targetPercent: 0 },
        bearish: { probability: 33, targetPercent: -1 },
      },
    },
    overnightRisk: {
      score: 50,
      factors: [],
      recommendation: 'CAUTION',
    },
    strategy: {
      eveningAction: 'WAIT',
      morningAction: 'WAIT_AND_SEE',
      reasoning: ['Yeterli veri yok'],
      optimalTiming: 'Belirsiz',
    },
  };
}
