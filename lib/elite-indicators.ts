// Elite Technical Indicators Engine
// Profesyonel Teknik Analiz - Hedge Fund Kalitesinde

import type { 
  HistoricalBar, 
  EliteTechnicalIndicators, 
  CandlePattern 
} from './elite-scanner-types';

// ==========================================
// TEMEL HESAPLAMA FONKSIYONLARI
// ==========================================

export function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / period;
}

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

function calculateEMAArray(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  let ema = calculateSMA(data.slice(0, Math.min(period, data.length)), Math.min(period, data.length));
  result.push(ema);
  
  for (let i = 1; i < data.length; i++) {
    if (i < period) {
      ema = calculateSMA(data.slice(0, i + 1), i + 1);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
    }
    result.push(ema);
  }
  
  return result;
}

function calculateStdDev(data: number[], period: number): number {
  if (data.length < period) return 0;
  const slice = data.slice(-period);
  const mean = slice.reduce((sum, val) => sum + val, 0) / period;
  const squaredDiffs = slice.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / period;
  return Math.sqrt(variance);
}

// ==========================================
// RSI - DETAYLI ANALIZ
// ==========================================

export function calculateDetailedRSI(closePrices: number[], period: number = 14): {
  current: number;
  previous: number;
  sma: number;
  divergence: 'bullish' | 'bearish' | 'none';
} {
  if (closePrices.length < period + 5) {
    return { current: 50, previous: 50, sma: 50, divergence: 'none' };
  }
  
  const rsiValues: number[] = [];
  
  for (let endIdx = period + 1; endIdx <= closePrices.length; endIdx++) {
    const slice = closePrices.slice(0, endIdx);
    let gains = 0, losses = 0;
    
    for (let i = slice.length - period; i < slice.length; i++) {
      const change = slice[i] - slice[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) rsiValues.push(100);
    else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }
  
  const current = rsiValues[rsiValues.length - 1] || 50;
  const previous = rsiValues[rsiValues.length - 2] || current;
  const sma = rsiValues.length >= 5 ? calculateSMA(rsiValues.slice(-5), 5) : current;
  
  // Divergence tespiti
  let divergence: 'bullish' | 'bearish' | 'none' = 'none';
  if (rsiValues.length >= 10) {
    const priceRecent = closePrices.slice(-10);
    const rsiRecent = rsiValues.slice(-10);
    
    const priceMakingLowerLow = priceRecent[priceRecent.length - 1] < Math.min(...priceRecent.slice(0, 5));
    const rsiMakingHigherLow = rsiRecent[rsiRecent.length - 1] > Math.min(...rsiRecent.slice(0, 5));
    
    const priceMakingHigherHigh = priceRecent[priceRecent.length - 1] > Math.max(...priceRecent.slice(0, 5));
    const rsiMakingLowerHigh = rsiRecent[rsiRecent.length - 1] < Math.max(...rsiRecent.slice(0, 5));
    
    if (priceMakingLowerLow && rsiMakingHigherLow && current < 40) {
      divergence = 'bullish';
    } else if (priceMakingHigherHigh && rsiMakingLowerHigh && current > 60) {
      divergence = 'bearish';
    }
  }
  
  return { current, previous, sma, divergence };
}

// ==========================================
// MACD - DETAYLI ANALIZ
// ==========================================

export function calculateDetailedMACD(
  closePrices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: number;
  signalLine: number;
  histogram: number;
  histogramPrev: number;
  crossover: 'bullish' | 'bearish' | 'none';
  divergence: 'bullish' | 'bearish' | 'none';
} {
  if (closePrices.length < slowPeriod + signalPeriod) {
    return { 
      macdLine: 0, signalLine: 0, histogram: 0, histogramPrev: 0,
      crossover: 'none', divergence: 'none'
    };
  }
  
  const macdValues: number[] = [];
  for (let i = slowPeriod; i <= closePrices.length; i++) {
    const slice = closePrices.slice(0, i);
    const fastEMA = calculateEMA(slice, fastPeriod);
    const slowEMA = calculateEMA(slice, slowPeriod);
    macdValues.push(fastEMA - slowEMA);
  }
  
  const signalValues = calculateEMAArray(macdValues, signalPeriod);
  
  const macdLine = macdValues[macdValues.length - 1] || 0;
  const signalLine = signalValues[signalValues.length - 1] || 0;
  const histogram = macdLine - signalLine;
  
  const prevMacdLine = macdValues[macdValues.length - 2] || 0;
  const prevSignalLine = signalValues[signalValues.length - 2] || 0;
  const histogramPrev = prevMacdLine - prevSignalLine;
  
  // Crossover tespiti
  let crossover: 'bullish' | 'bearish' | 'none' = 'none';
  if (histogram > 0 && histogramPrev <= 0) crossover = 'bullish';
  else if (histogram < 0 && histogramPrev >= 0) crossover = 'bearish';
  
  // Divergence tespiti
  let divergence: 'bullish' | 'bearish' | 'none' = 'none';
  if (macdValues.length >= 15) {
    const priceRecent = closePrices.slice(-15);
    const macdRecent = macdValues.slice(-15);
    
    const priceMakingLowerLow = priceRecent[priceRecent.length - 1] < Math.min(...priceRecent.slice(0, 8));
    const macdMakingHigherLow = macdRecent[macdRecent.length - 1] > Math.min(...macdRecent.slice(0, 8));
    
    const priceMakingHigherHigh = priceRecent[priceRecent.length - 1] > Math.max(...priceRecent.slice(0, 8));
    const macdMakingLowerHigh = macdRecent[macdRecent.length - 1] < Math.max(...macdRecent.slice(0, 8));
    
    if (priceMakingLowerLow && macdMakingHigherLow) divergence = 'bullish';
    else if (priceMakingHigherHigh && macdMakingLowerHigh) divergence = 'bearish';
  }
  
  return { macdLine, signalLine, histogram, histogramPrev, crossover, divergence };
}

// ==========================================
// STOCHASTIC OSCILLATOR
// ==========================================

export function calculateStochastic(
  bars: HistoricalBar[],
  kPeriod: number = 14,
  dPeriod: number = 3
): {
  k: number;
  d: number;
  kPrev: number;
  crossover: 'bullish' | 'bearish' | 'none';
} {
  if (bars.length < kPeriod + dPeriod) {
    return { k: 50, d: 50, kPrev: 50, crossover: 'none' };
  }
  
  const kValues: number[] = [];
  
  for (let i = kPeriod; i <= bars.length; i++) {
    const slice = bars.slice(i - kPeriod, i);
    const highest = Math.max(...slice.map(b => b.high));
    const lowest = Math.min(...slice.map(b => b.low));
    const currentClose = slice[slice.length - 1].close;
    
    if (highest === lowest) kValues.push(50);
    else kValues.push(((currentClose - lowest) / (highest - lowest)) * 100);
  }
  
  const dValues: number[] = [];
  for (let i = dPeriod; i <= kValues.length; i++) {
    dValues.push(calculateSMA(kValues.slice(i - dPeriod, i), dPeriod));
  }
  
  const k = kValues[kValues.length - 1] || 50;
  const kPrev = kValues[kValues.length - 2] || k;
  const d = dValues[dValues.length - 1] || k;
  const dPrev = dValues[dValues.length - 2] || d;
  
  let crossover: 'bullish' | 'bearish' | 'none' = 'none';
  if (k > d && kPrev <= dPrev) crossover = 'bullish';
  else if (k < d && kPrev >= dPrev) crossover = 'bearish';
  
  return { k, d, kPrev, crossover };
}

// ==========================================
// WILLIAMS %R
// ==========================================

export function calculateWilliamsR(bars: HistoricalBar[], period: number = 14): number {
  if (bars.length < period) return -50;
  
  const slice = bars.slice(-period);
  const highest = Math.max(...slice.map(b => b.high));
  const lowest = Math.min(...slice.map(b => b.low));
  const currentClose = slice[slice.length - 1].close;
  
  if (highest === lowest) return -50;
  return ((highest - currentClose) / (highest - lowest)) * -100;
}

// ==========================================
// CCI - COMMODITY CHANNEL INDEX
// ==========================================

export function calculateCCI(bars: HistoricalBar[], period: number = 20): number {
  if (bars.length < period) return 0;
  
  const typicalPrices = bars.map(b => (b.high + b.low + b.close) / 3);
  const slice = typicalPrices.slice(-period);
  const sma = slice.reduce((sum, val) => sum + val, 0) / period;
  
  const meanDeviation = slice.reduce((sum, val) => sum + Math.abs(val - sma), 0) / period;
  
  if (meanDeviation === 0) return 0;
  return (typicalPrices[typicalPrices.length - 1] - sma) / (0.015 * meanDeviation);
}

// ==========================================
// MFI - MONEY FLOW INDEX
// ==========================================

export function calculateMFI(bars: HistoricalBar[], period: number = 14): number {
  if (bars.length < period + 1) return 50;
  
  let positiveFlow = 0;
  let negativeFlow = 0;
  
  for (let i = bars.length - period; i < bars.length; i++) {
    const typicalPrice = (bars[i].high + bars[i].low + bars[i].close) / 3;
    const prevTypicalPrice = (bars[i - 1].high + bars[i - 1].low + bars[i - 1].close) / 3;
    const moneyFlow = typicalPrice * bars[i].volume;
    
    if (typicalPrice > prevTypicalPrice) {
      positiveFlow += moneyFlow;
    } else if (typicalPrice < prevTypicalPrice) {
      negativeFlow += moneyFlow;
    }
  }
  
  if (negativeFlow === 0) return 100;
  const moneyFlowRatio = positiveFlow / negativeFlow;
  return 100 - (100 / (1 + moneyFlowRatio));
}

// ==========================================
// EMA SUITE
// ==========================================

export function calculateEMASuite(closePrices: number[]): {
  ema5: number;
  ema8: number;
  ema13: number;
  ema21: number;
  ema34: number;
  ema55: number;
  ema89: number;
  ema200: number;
  alignment: 'perfect_bullish' | 'bullish' | 'mixed' | 'bearish' | 'perfect_bearish';
} {
  const ema5 = calculateEMA(closePrices, 5);
  const ema8 = calculateEMA(closePrices, 8);
  const ema13 = calculateEMA(closePrices, 13);
  const ema21 = calculateEMA(closePrices, 21);
  const ema34 = calculateEMA(closePrices, 34);
  const ema55 = calculateEMA(closePrices, 55);
  const ema89 = calculateEMA(closePrices, 89);
  const ema200 = calculateEMA(closePrices, Math.min(200, closePrices.length));
  
  // Alignment analizi
  const shortTermEMAs = [ema5, ema8, ema13];
  const midTermEMAs = [ema21, ema34];
  const longTermEMAs = [ema55, ema89];
  
  const shortAboveMid = shortTermEMAs.every(s => midTermEMAs.every(m => s > m));
  const midAboveLong = midTermEMAs.every(m => longTermEMAs.every(l => m > l));
  const shortBelowMid = shortTermEMAs.every(s => midTermEMAs.every(m => s < m));
  const midBelowLong = midTermEMAs.every(m => longTermEMAs.every(l => m < l));
  
  let alignment: 'perfect_bullish' | 'bullish' | 'mixed' | 'bearish' | 'perfect_bearish';
  
  if (shortAboveMid && midAboveLong && ema5 > ema200) {
    alignment = 'perfect_bullish';
  } else if (shortAboveMid && midAboveLong) {
    alignment = 'bullish';
  } else if (shortBelowMid && midBelowLong && ema5 < ema200) {
    alignment = 'perfect_bearish';
  } else if (shortBelowMid && midBelowLong) {
    alignment = 'bearish';
  } else {
    alignment = 'mixed';
  }
  
  return { ema5, ema8, ema13, ema21, ema34, ema55, ema89, ema200, alignment };
}

// ==========================================
// ADX - AVERAGE DIRECTIONAL INDEX
// ==========================================

export function calculateDetailedADX(bars: HistoricalBar[], period: number = 14): {
  value: number;
  plusDI: number;
  minusDI: number;
  trend: 'strong_up' | 'up' | 'weak' | 'down' | 'strong_down';
} {
  if (bars.length < period + 1) {
    return { value: 20, plusDI: 50, minusDI: 50, trend: 'weak' };
  }
  
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevHigh = bars[i - 1].high;
    const prevLow = bars[i - 1].low;
    const prevClose = bars[i - 1].close;
    
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  const smoothedTR = calculateEMA(tr, period);
  const smoothedPlusDM = calculateEMA(plusDM, period);
  const smoothedMinusDM = calculateEMA(minusDM, period);
  
  if (smoothedTR === 0) {
    return { value: 20, plusDI: 50, minusDI: 50, trend: 'weak' };
  }
  
  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;
  
  const diSum = plusDI + minusDI;
  const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
  
  const adx = Math.min(100, Math.max(0, dx));
  
  let trend: 'strong_up' | 'up' | 'weak' | 'down' | 'strong_down';
  if (adx > 40 && plusDI > minusDI) trend = 'strong_up';
  else if (adx > 25 && plusDI > minusDI) trend = 'up';
  else if (adx > 40 && minusDI > plusDI) trend = 'strong_down';
  else if (adx > 25 && minusDI > plusDI) trend = 'down';
  else trend = 'weak';
  
  return { value: adx, plusDI, minusDI, trend };
}

// ==========================================
// PARABOLIC SAR
// ==========================================

export function calculateParabolicSAR(bars: HistoricalBar[]): {
  value: number;
  trend: 'bullish' | 'bearish';
  reversal: boolean;
} {
  if (bars.length < 5) {
    return { value: bars[bars.length - 1]?.close || 0, trend: 'bullish', reversal: false };
  }
  
  const AF_START = 0.02;
  const AF_INCREMENT = 0.02;
  const AF_MAX = 0.2;
  
  let af = AF_START;
  let ep = bars[0].high;
  let sar = bars[0].low;
  let trend: 'bullish' | 'bearish' = 'bullish';
  let prevTrend = trend;
  
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    
    prevTrend = trend;
    
    if (trend === 'bullish') {
      sar = sar + af * (ep - sar);
      sar = Math.min(sar, bars[i - 1].low, i > 1 ? bars[i - 2].low : bars[i - 1].low);
      
      if (low < sar) {
        trend = 'bearish';
        sar = ep;
        ep = low;
        af = AF_START;
      } else {
        if (high > ep) {
          ep = high;
          af = Math.min(af + AF_INCREMENT, AF_MAX);
        }
      }
    } else {
      sar = sar + af * (ep - sar);
      sar = Math.max(sar, bars[i - 1].high, i > 1 ? bars[i - 2].high : bars[i - 1].high);
      
      if (high > sar) {
        trend = 'bullish';
        sar = ep;
        ep = high;
        af = AF_START;
      } else {
        if (low < ep) {
          ep = low;
          af = Math.min(af + AF_INCREMENT, AF_MAX);
        }
      }
    }
  }
  
  return { value: sar, trend, reversal: trend !== prevTrend };
}

// ==========================================
// ICHIMOKU CLOUD
// ==========================================

export function calculateIchimoku(bars: HistoricalBar[]): {
  tenkan: number;
  kijun: number;
  senkouA: number;
  senkouB: number;
  chikou: number;
  cloudTop: number;
  cloudBottom: number;
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
} {
  const tenkanPeriod = 9;
  const kijunPeriod = 26;
  const senkouBPeriod = 52;
  
  const calculateMidpoint = (data: HistoricalBar[], period: number): number => {
    if (data.length < period) return data[data.length - 1]?.close || 0;
    const slice = data.slice(-period);
    const highest = Math.max(...slice.map(b => b.high));
    const lowest = Math.min(...slice.map(b => b.low));
    return (highest + lowest) / 2;
  };
  
  const tenkan = calculateMidpoint(bars, tenkanPeriod);
  const kijun = calculateMidpoint(bars, kijunPeriod);
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = calculateMidpoint(bars, senkouBPeriod);
  const chikou = bars[bars.length - 1]?.close || 0;
  
  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBottom = Math.min(senkouA, senkouB);
  
  const currentPrice = bars[bars.length - 1]?.close || 0;
  
  // Sinyal hesaplama
  let signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  
  const priceAboveCloud = currentPrice > cloudTop;
  const priceBelowCloud = currentPrice < cloudBottom;
  const tenkanAboveKijun = tenkan > kijun;
  const cloudBullish = senkouA > senkouB;
  
  if (priceAboveCloud && tenkanAboveKijun && cloudBullish) {
    signal = 'strong_buy';
  } else if (priceAboveCloud && tenkanAboveKijun) {
    signal = 'buy';
  } else if (priceBelowCloud && !tenkanAboveKijun && !cloudBullish) {
    signal = 'strong_sell';
  } else if (priceBelowCloud && !tenkanAboveKijun) {
    signal = 'sell';
  } else {
    signal = 'neutral';
  }
  
  return { tenkan, kijun, senkouA, senkouB, chikou, cloudTop, cloudBottom, signal };
}

// ==========================================
// BOLLINGER BANDS - DETAYLI
// ==========================================

export function calculateDetailedBollingerBands(
  closePrices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  upper: number;
  middle: number;
  lower: number;
  percentB: number;
  bandwidth: number;
  squeeze: boolean;
} {
  if (closePrices.length < period) {
    const price = closePrices[closePrices.length - 1] || 0;
    return { upper: price, middle: price, lower: price, percentB: 50, bandwidth: 0, squeeze: false };
  }
  
  const middle = calculateSMA(closePrices, period);
  const stdDev = calculateStdDev(closePrices, period);
  
  const upper = middle + (stdDev * stdDevMultiplier);
  const lower = middle - (stdDev * stdDevMultiplier);
  
  const currentPrice = closePrices[closePrices.length - 1];
  const bandWidth = upper - lower;
  const percentB = bandWidth > 0 ? ((currentPrice - lower) / bandWidth) * 100 : 50;
  const bandwidth = (bandWidth / middle) * 100; // Yuzde olarak band genisligi
  
  // Squeeze tespiti - son 20 gundeki en dusuk bandwidth
  const bandwidths: number[] = [];
  for (let i = period; i <= closePrices.length; i++) {
    const slice = closePrices.slice(i - period, i);
    const m = calculateSMA(slice, period);
    const s = calculateStdDev(slice, period);
    const bw = ((m + s * 2) - (m - s * 2)) / m * 100;
    bandwidths.push(bw);
  }
  
  const avgBandwidth = bandwidths.length > 10 
    ? calculateSMA(bandwidths.slice(-20), Math.min(20, bandwidths.length))
    : bandwidth;
  
  const squeeze = bandwidth < avgBandwidth * 0.8; // Ortalamadan %20 daha dar
  
  return {
    upper,
    middle,
    lower,
    percentB: Math.max(0, Math.min(100, percentB)),
    bandwidth,
    squeeze,
  };
}

// ==========================================
// ATR - DETAYLI
// ==========================================

export function calculateDetailedATR(bars: HistoricalBar[], period: number = 14): {
  value: number;
  percent: number;
  trend: 'expanding' | 'contracting' | 'stable';
} {
  if (bars.length < period + 5) {
    return { value: 0, percent: 0, trend: 'stable' };
  }
  
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
  
  const atr = calculateEMA(trueRanges, period);
  const currentPrice = bars[bars.length - 1].close;
  const atrPercent = (atr / currentPrice) * 100;
  
  // ATR trend
  const recentATRs = trueRanges.slice(-10).map((_, idx) => {
    const slice = trueRanges.slice(0, trueRanges.length - 9 + idx);
    return calculateEMA(slice, Math.min(period, slice.length));
  });
  
  let trend: 'expanding' | 'contracting' | 'stable' = 'stable';
  if (recentATRs.length >= 5) {
    const firstHalf = calculateSMA(recentATRs.slice(0, 5), 5);
    const secondHalf = calculateSMA(recentATRs.slice(-5), 5);
    
    if (secondHalf > firstHalf * 1.1) trend = 'expanding';
    else if (secondHalf < firstHalf * 0.9) trend = 'contracting';
  }
  
  return { value: atr, percent: atrPercent, trend };
}

// ==========================================
// KELTNER CHANNELS
// ==========================================

export function calculateKeltnerChannels(bars: HistoricalBar[], emaPeriod: number = 20, atrMultiplier: number = 2): {
  upper: number;
  middle: number;
  lower: number;
} {
  const closePrices = bars.map(b => b.close);
  const middle = calculateEMA(closePrices, emaPeriod);
  const atr = calculateDetailedATR(bars, 10).value;
  
  return {
    upper: middle + (atr * atrMultiplier),
    middle,
    lower: middle - (atr * atrMultiplier),
  };
}

// ==========================================
// VOLUME ANALYSIS
// ==========================================

export function analyzeVolume(bars: HistoricalBar[]): {
  current: number;
  sma20: number;
  ratio: number;
  trend: 'very_high' | 'high' | 'normal' | 'low' | 'very_low';
} {
  if (bars.length < 2) {
    return { current: 0, sma20: 0, ratio: 1, trend: 'normal' };
  }
  
  const volumes = bars.map(b => b.volume);
  const current = volumes[volumes.length - 1];
  const sma20 = calculateSMA(volumes, Math.min(20, volumes.length));
  const ratio = sma20 > 0 ? current / sma20 : 1;
  
  let trend: 'very_high' | 'high' | 'normal' | 'low' | 'very_low';
  if (ratio >= 2.5) trend = 'very_high';
  else if (ratio >= 1.5) trend = 'high';
  else if (ratio >= 0.7) trend = 'normal';
  else if (ratio >= 0.4) trend = 'low';
  else trend = 'very_low';
  
  return { current, sma20, ratio, trend };
}

// ==========================================
// OBV - ON BALANCE VOLUME
// ==========================================

export function calculateDetailedOBV(bars: HistoricalBar[]): {
  value: number;
  trend: 'rising' | 'falling' | 'flat';
  divergence: 'bullish' | 'bearish' | 'none';
} {
  if (bars.length < 10) {
    return { value: 0, trend: 'flat', divergence: 'none' };
  }
  
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
  
  // Trend
  const recentOBV = obvValues.slice(-10);
  const obvChange = recentOBV[recentOBV.length - 1] - recentOBV[0];
  const avgVolume = bars.slice(-10).reduce((sum, b) => sum + b.volume, 0) / 10;
  
  let trend: 'rising' | 'falling' | 'flat' = 'flat';
  if (obvChange > avgVolume * 2) trend = 'rising';
  else if (obvChange < -avgVolume * 2) trend = 'falling';
  
  // Divergence
  let divergence: 'bullish' | 'bearish' | 'none' = 'none';
  const priceRecent = bars.slice(-10).map(b => b.close);
  
  const priceMakingLowerLow = priceRecent[priceRecent.length - 1] < Math.min(...priceRecent.slice(0, 5));
  const obvMakingHigherLow = recentOBV[recentOBV.length - 1] > Math.min(...recentOBV.slice(0, 5));
  
  const priceMakingHigherHigh = priceRecent[priceRecent.length - 1] > Math.max(...priceRecent.slice(0, 5));
  const obvMakingLowerHigh = recentOBV[recentOBV.length - 1] < Math.max(...recentOBV.slice(0, 5));
  
  if (priceMakingLowerLow && obvMakingHigherLow) divergence = 'bullish';
  else if (priceMakingHigherHigh && obvMakingLowerHigh) divergence = 'bearish';
  
  return { value: obv, trend, divergence };
}

// ==========================================
// VWAP
// ==========================================

export function calculateVWAP(bars: HistoricalBar[]): number {
  if (bars.length === 0) return 0;
  
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += typicalPrice * bar.volume;
    cumulativeVolume += bar.volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : bars[bars.length - 1].close;
}

// ==========================================
// CHAIKIN MONEY FLOW
// ==========================================

export function calculateChaikinMF(bars: HistoricalBar[], period: number = 20): number {
  if (bars.length < period) return 0;
  
  let sumMFV = 0;
  let sumVolume = 0;
  
  for (let i = bars.length - period; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const close = bars[i].close;
    const volume = bars[i].volume;
    
    const mfm = high === low ? 0 : ((close - low) - (high - close)) / (high - low);
    sumMFV += mfm * volume;
    sumVolume += volume;
  }
  
  return sumVolume > 0 ? sumMFV / sumVolume : 0;
}

// ==========================================
// ACCUMULATION/DISTRIBUTION
// ==========================================

export function calculateAccDist(bars: HistoricalBar[]): {
  value: number;
  trend: 'accumulation' | 'distribution' | 'neutral';
} {
  if (bars.length < 10) return { value: 0, trend: 'neutral' };
  
  let ad = 0;
  const adValues: number[] = [];
  
  for (const bar of bars) {
    const mfm = bar.high === bar.low ? 0 : ((bar.close - bar.low) - (bar.high - bar.close)) / (bar.high - bar.low);
    ad += mfm * bar.volume;
    adValues.push(ad);
  }
  
  const recent = adValues.slice(-10);
  const change = recent[recent.length - 1] - recent[0];
  const avgChange = Math.abs(change) / 10;
  
  let trend: 'accumulation' | 'distribution' | 'neutral' = 'neutral';
  if (change > avgChange * 5) trend = 'accumulation';
  else if (change < -avgChange * 5) trend = 'distribution';
  
  return { value: ad, trend };
}

// ==========================================
// PIVOT POINTS
// ==========================================

export function calculatePivotPoints(bars: HistoricalBar[]): {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
} {
  if (bars.length < 2) {
    const price = bars[bars.length - 1]?.close || 0;
    return { pivot: price, r1: price, r2: price, r3: price, s1: price, s2: price, s3: price };
  }
  
  // Onceki gunun OHLC
  const prevBar = bars[bars.length - 2];
  const high = prevBar.high;
  const low = prevBar.low;
  const close = prevBar.close;
  
  const pivot = (high + low + close) / 3;
  const r1 = (2 * pivot) - low;
  const s1 = (2 * pivot) - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  const r3 = high + 2 * (pivot - low);
  const s3 = low - 2 * (high - pivot);
  
  return { pivot, r1, r2, r3, s1, s2, s3 };
}

// ==========================================
// FIBONACCI RETRACEMENT
// ==========================================

export function calculateFibonacciLevels(bars: HistoricalBar[], lookback: number = 50): {
  high: number;
  low: number;
  level236: number;
  level382: number;
  level500: number;
  level618: number;
  level786: number;
} {
  const slice = bars.slice(-lookback);
  const high = Math.max(...slice.map(b => b.high));
  const low = Math.min(...slice.map(b => b.low));
  const range = high - low;
  
  return {
    high,
    low,
    level236: high - (range * 0.236),
    level382: high - (range * 0.382),
    level500: high - (range * 0.500),
    level618: high - (range * 0.618),
    level786: high - (range * 0.786),
  };
}

// ==========================================
// MUM FORMASYONLARI
// ==========================================

export function detectCandlePattern(bars: HistoricalBar[]): {
  pattern: CandlePattern | null;
  strength: number;
  direction: 'bullish' | 'bearish' | 'neutral';
} {
  if (bars.length < 3) {
    return { pattern: null, strength: 0, direction: 'neutral' };
  }
  
  const current = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const prev2 = bars[bars.length - 3];
  
  const body = Math.abs(current.close - current.open);
  const range = current.high - current.low;
  const upperShadow = current.high - Math.max(current.open, current.close);
  const lowerShadow = Math.min(current.open, current.close) - current.low;
  
  const isBullish = current.close > current.open;
  const isBearish = current.close < current.open;
  
  // Doji
  if (body / range < 0.1) {
    if (lowerShadow > body * 2 && upperShadow < body) {
      return { pattern: 'dragonfly_doji', strength: 4, direction: 'bullish' };
    }
    if (upperShadow > body * 2 && lowerShadow < body) {
      return { pattern: 'gravestone_doji', strength: 4, direction: 'bearish' };
    }
    return { pattern: 'doji', strength: 3, direction: 'neutral' };
  }
  
  // Hammer
  if (lowerShadow > body * 2 && upperShadow < body * 0.5 && prev.close < prev.open) {
    return { pattern: 'hammer', strength: 4, direction: 'bullish' };
  }
  
  // Inverted Hammer
  if (upperShadow > body * 2 && lowerShadow < body * 0.5 && prev.close < prev.open) {
    return { pattern: 'inverted_hammer', strength: 3, direction: 'bullish' };
  }
  
  // Bullish Engulfing
  const prevBody = Math.abs(prev.close - prev.open);
  if (isBullish && prev.close < prev.open && 
      current.open < prev.close && current.close > prev.open &&
      body > prevBody) {
    return { pattern: 'bullish_engulfing', strength: 5, direction: 'bullish' };
  }
  
  // Bearish Engulfing
  if (isBearish && prev.close > prev.open &&
      current.open > prev.close && current.close < prev.open &&
      body > prevBody) {
    return { pattern: 'bearish_engulfing', strength: 5, direction: 'bearish' };
  }
  
  // Morning Star
  const prev2Body = Math.abs(prev2.close - prev2.open);
  if (prev2.close < prev2.open && // Ilk mum bearish
      Math.abs(prev.close - prev.open) < prev2Body * 0.3 && // Ortadaki kucuk
      isBullish && current.close > (prev2.open + prev2.close) / 2) { // Son mum yukari
    return { pattern: 'morning_star', strength: 5, direction: 'bullish' };
  }
  
  // Evening Star
  if (prev2.close > prev2.open &&
      Math.abs(prev.close - prev.open) < prev2Body * 0.3 &&
      isBearish && current.close < (prev2.open + prev2.close) / 2) {
    return { pattern: 'evening_star', strength: 5, direction: 'bearish' };
  }
  
  // Three White Soldiers
  const prev3 = bars.length >= 4 ? bars[bars.length - 4] : null;
  if (prev3 && 
      current.close > current.open && prev.close > prev.open && prev2.close > prev2.open &&
      current.close > prev.close && prev.close > prev2.close) {
    return { pattern: 'three_white_soldiers', strength: 5, direction: 'bullish' };
  }
  
  // Three Black Crows
  if (prev3 &&
      current.close < current.open && prev.close < prev.open && prev2.close < prev2.open &&
      current.close < prev.close && prev.close < prev2.close) {
    return { pattern: 'three_black_crows', strength: 5, direction: 'bearish' };
  }
  
  // Marubozu
  if (body / range > 0.9) {
    if (isBullish) return { pattern: 'marubozu_bullish', strength: 4, direction: 'bullish' };
    if (isBearish) return { pattern: 'marubozu_bearish', strength: 4, direction: 'bearish' };
  }
  
  // Spinning Top
  if (body / range < 0.3 && upperShadow > body && lowerShadow > body) {
    return { pattern: 'spinning_top', strength: 2, direction: 'neutral' };
  }
  
  return { pattern: null, strength: 0, direction: 'neutral' };
}

// ==========================================
// MOMENTUM (ROC)
// ==========================================

export function calculateMomentum(closePrices: number[]): {
  roc5: number;
  roc10: number;
  roc20: number;
} {
  const currentPrice = closePrices[closePrices.length - 1] || 0;
  
  const roc5 = closePrices.length >= 6 
    ? ((currentPrice - closePrices[closePrices.length - 6]) / closePrices[closePrices.length - 6]) * 100 
    : 0;
  
  const roc10 = closePrices.length >= 11
    ? ((currentPrice - closePrices[closePrices.length - 11]) / closePrices[closePrices.length - 11]) * 100
    : 0;
  
  const roc20 = closePrices.length >= 21
    ? ((currentPrice - closePrices[closePrices.length - 21]) / closePrices[closePrices.length - 21]) * 100
    : 0;
  
  return { roc5, roc10, roc20 };
}

// ==========================================
// ANA HESAPLAMA FONKSIYONU
// ==========================================

export function calculateEliteIndicators(bars: HistoricalBar[]): EliteTechnicalIndicators {
  const closePrices = bars.map(b => b.close);
  const currentPrice = closePrices[closePrices.length - 1] || 0;
  
  const rsi = calculateDetailedRSI(closePrices, 14);
  const macd = calculateDetailedMACD(closePrices, 12, 26, 9);
  const stochastic = calculateStochastic(bars, 14, 3);
  const williamsR = calculateWilliamsR(bars, 14);
  const cci = calculateCCI(bars, 20);
  const mfi = calculateMFI(bars, 14);
  
  const ema = calculateEMASuite(closePrices);
  const sma10 = calculateSMA(closePrices, 10);
  const sma20 = calculateSMA(closePrices, 20);
  const sma50 = calculateSMA(closePrices, 50);
  const sma100 = calculateSMA(closePrices, Math.min(100, closePrices.length));
  const sma200 = calculateSMA(closePrices, Math.min(200, closePrices.length));
  
  const adx = calculateDetailedADX(bars, 14);
  const parabolicSar = calculateParabolicSAR(bars);
  const ichimoku = calculateIchimoku(bars);
  
  const bollingerBands = calculateDetailedBollingerBands(closePrices, 20, 2);
  const atr = calculateDetailedATR(bars, 14);
  const keltnerChannels = calculateKeltnerChannels(bars, 20, 2);
  
  const volume = analyzeVolume(bars);
  const obv = calculateDetailedOBV(bars);
  const vwap = calculateVWAP(bars);
  const chaikinMF = calculateChaikinMF(bars, 20);
  const accDist = calculateAccDist(bars);
  
  const pivotPoints = calculatePivotPoints(bars);
  const fibonacciLevels = calculateFibonacciLevels(bars, 50);
  
  const candlePattern = detectCandlePattern(bars);
  const momentum = calculateMomentum(closePrices);
  
  // Multi-timeframe trend (basitlestirilmis)
  const last5Close = closePrices.slice(-5);
  const last20Close = closePrices.slice(-20);
  
  const dailyTrend: 'up' | 'down' | 'sideways' = 
    last5Close[last5Close.length - 1] > calculateSMA(last5Close, 5) ? 'up' :
    last5Close[last5Close.length - 1] < calculateSMA(last5Close, 5) ? 'down' : 'sideways';
  
  const weeklyTrend: 'up' | 'down' | 'sideways' =
    last20Close[last20Close.length - 1] > calculateSMA(last20Close, 20) ? 'up' :
    last20Close[last20Close.length - 1] < calculateSMA(last20Close, 20) ? 'down' : 'sideways';
  
  // Price Position
  const high52Week = Math.max(...closePrices);
  const low52Week = Math.min(...closePrices);
  const range52Week = high52Week - low52Week;
  
  const pricePosition = {
    inRange52Week: range52Week > 0 ? ((currentPrice - low52Week) / range52Week) * 100 : 50,
    distanceFrom52High: ((high52Week - currentPrice) / high52Week) * 100,
    distanceFrom52Low: ((currentPrice - low52Week) / low52Week) * 100,
    distance200SMA: ((currentPrice - sma200) / sma200) * 100,
  };
  
  return {
    rsi,
    macd,
    stochastic,
    williamsR,
    cci,
    mfi,
    ema,
    sma: { sma10, sma20, sma50, sma100, sma200 },
    adx,
    parabolicSar,
    ichimoku,
    bollingerBands,
    atr,
    keltnerChannels,
    volume,
    obv,
    vwap,
    chaikinMF,
    accDist,
    pivotPoints,
    fibonacciLevels,
    candlePattern,
    dailyTrend,
    weeklyTrend,
    pricePosition,
    momentum,
  };
}
