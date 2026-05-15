// Signal Detection Engine
// Analyzes technical indicators and generates buy/sell signals

import type { TechnicalIndicators, Signal } from './scanner-types';
import { SIGNAL_POINTS } from './scanner-types';

/**
 * Analyze all indicators and generate signals
 */
export function analyzeSignals(
  indicators: TechnicalIndicators,
  currentPrice: number,
  dayChangePercent: number,
  fiftyTwoWeekLow?: number
): Signal[] {
  const signals: Signal[] = [];

  // ==========================================
  // RSI SIGNALS
  // ==========================================
  
  // RSI oversold and rising
  if (indicators.rsi < 30 && indicators.rsi > indicators.rsiPrev) {
    signals.push({
      type: 'buy',
      category: 'rsi',
      name: 'RSI Asiri Satim Bolgesi',
      description: `RSI ${indicators.rsi.toFixed(1)} seviyesinden yukseliyor (asiri satim bolgesi)`,
      points: SIGNAL_POINTS.RSI_OVERSOLD_RISING,
    });
  } else if (indicators.rsi >= 30 && indicators.rsi <= 40 && indicators.rsi > indicators.rsiPrev) {
    signals.push({
      type: 'buy',
      category: 'rsi',
      name: 'RSI Dusuk Seviyeden Yukseliyor',
      description: `RSI ${indicators.rsi.toFixed(1)} seviyesinde yukselise gecti`,
      points: SIGNAL_POINTS.RSI_LOW_RISING,
    });
  }

  // RSI overbought (sell signal)
  if (indicators.rsi > 80) {
    signals.push({
      type: 'sell',
      category: 'rsi',
      name: 'RSI Asiri Alim Bolgesi (Kritik)',
      description: `RSI ${indicators.rsi.toFixed(1)} - geri cekilme riski yuksek`,
      points: SIGNAL_POINTS.RSI_EXTREME_OVERBOUGHT,
    });
  } else if (indicators.rsi > 70) {
    signals.push({
      type: 'sell',
      category: 'rsi',
      name: 'RSI Asiri Alim Bolgesi',
      description: `RSI ${indicators.rsi.toFixed(1)} - dikkatli olunmali`,
      points: SIGNAL_POINTS.RSI_OVERBOUGHT,
    });
  }

  // ==========================================
  // MACD SIGNALS
  // ==========================================
  
  // MACD histogram turning positive
  if (indicators.macd.histogram > 0 && indicators.macd.histogramPrev <= 0) {
    signals.push({
      type: 'buy',
      category: 'macd',
      name: 'MACD Pozitife Donuyor',
      description: 'MACD histogram negatiften pozitife gecis yapti',
      points: SIGNAL_POINTS.MACD_HISTOGRAM_POSITIVE,
    });
  }

  // MACD bullish cross
  if (indicators.macd.macdLine > indicators.macd.signalLine && 
      indicators.macd.histogram > 0 && 
      indicators.macd.histogramPrev <= 0) {
    signals.push({
      type: 'buy',
      category: 'macd',
      name: 'MACD Yukari Kesiyor',
      description: 'MACD cizgisi sinyal cizgisini yukari kesiyor',
      points: SIGNAL_POINTS.MACD_BULLISH_CROSS,
    });
  }

  // MACD histogram turning negative
  if (indicators.macd.histogram < 0 && indicators.macd.histogramPrev >= 0) {
    signals.push({
      type: 'sell',
      category: 'macd',
      name: 'MACD Negatife Donuyor',
      description: 'MACD histogram pozitiften negatife gecis yapti',
      points: SIGNAL_POINTS.MACD_HISTOGRAM_NEGATIVE,
    });
  }

  // ==========================================
  // BOLLINGER BANDS SIGNALS
  // ==========================================
  
  // Price near lower band (buy opportunity)
  if (indicators.bollingerBands.percentB < 10) {
    signals.push({
      type: 'buy',
      category: 'bollinger',
      name: 'Bollinger Alt Bandina Yakin',
      description: `Fiyat Bollinger alt bandina cok yakin (%${indicators.bollingerBands.percentB.toFixed(0)})`,
      points: SIGNAL_POINTS.PRICE_NEAR_LOWER_BB,
    });
  }

  // Price above upper band (sell signal)
  if (indicators.bollingerBands.percentB > 100) {
    signals.push({
      type: 'sell',
      category: 'bollinger',
      name: 'Bollinger Ust Bandinin Ustunde',
      description: 'Fiyat Bollinger ust bandini asti - geri cekilme bekleniyor',
      points: SIGNAL_POINTS.PRICE_ABOVE_UPPER_BB,
    });
  }

  // ==========================================
  // EMA SIGNALS
  // ==========================================
  
  // Price crossing EMA9 upward
  if (currentPrice > indicators.ema.ema9 && 
      currentPrice <= indicators.ema.ema9 * 1.01) {
    signals.push({
      type: 'buy',
      category: 'ema',
      name: 'Fiyat 9 EMA Ustunde',
      description: 'Fiyat 9 gunluk EMA\'yi yukari kesiyor',
      points: SIGNAL_POINTS.PRICE_CROSS_EMA9_UP,
    });
  }

  // Price above EMA21
  if (currentPrice > indicators.ema.ema21) {
    signals.push({
      type: 'buy',
      category: 'ema',
      name: 'Fiyat 21 EMA Ustunde',
      description: 'Fiyat 21 gunluk EMA\'nin ustunde islem goruyor',
      points: SIGNAL_POINTS.PRICE_ABOVE_EMA21,
    });
  }

  // Price approaching SMA50 from below
  if (currentPrice < indicators.ema.ema50 && 
      currentPrice > indicators.ema.ema50 * 0.95) {
    signals.push({
      type: 'buy',
      category: 'ema',
      name: '50 EMA\'ya Yaklasim',
      description: 'Fiyat 50 gunluk EMA\'ya alttan yaklasıyor',
      points: SIGNAL_POINTS.PRICE_APPROACHING_SMA50,
    });
  }

  // Price below EMA50 and falling
  if (currentPrice < indicators.ema.ema50 * 0.95 && dayChangePercent < -1) {
    signals.push({
      type: 'sell',
      category: 'ema',
      name: '50 EMA Altinda Dusus',
      description: 'Fiyat 50 EMA altinda ve dusmeye devam ediyor',
      points: SIGNAL_POINTS.PRICE_BELOW_EMA50_FALLING,
    });
  }

  // ==========================================
  // VOLUME SIGNALS
  // ==========================================
  
  const volumeRatio = indicators.volumeSMA20 > 0 
    ? indicators.volumeSMA20 / indicators.volumeSMA20 
    : 1;

  // Note: For real volume comparison, we'd need current volume
  // This is a placeholder - actual implementation compares current volume to volumeSMA20
  if (volumeRatio >= 2) {
    signals.push({
      type: 'buy',
      category: 'volume',
      name: 'Cok Yuksek Hacim',
      description: 'Hacim 20 gunluk ortalamanin 2 katindan fazla',
      points: SIGNAL_POINTS.VOLUME_HIGH_2X,
    });
  } else if (volumeRatio >= 1.5) {
    signals.push({
      type: 'buy',
      category: 'volume',
      name: 'Yuksek Hacim',
      description: 'Hacim 20 gunluk ortalamanin 1.5 kati',
      points: SIGNAL_POINTS.VOLUME_HIGH_1_5X,
    });
  }

  // Low volume warning
  if (volumeRatio < 0.5) {
    signals.push({
      type: 'sell',
      category: 'volume',
      name: 'Dusuk Hacim',
      description: 'Hacim normalin altinda - likidite riski',
      points: SIGNAL_POINTS.VOLUME_LOW,
    });
  }

  // ==========================================
  // TREND SIGNALS
  // ==========================================
  
  // 3-day uptrend
  if (indicators.priceChange3Days >= 3) {
    signals.push({
      type: 'buy',
      category: 'trend',
      name: '3 Gun Ust Uste Yukselis',
      description: 'Son 3 gun arka arkaya pozitif kapanis',
      points: SIGNAL_POINTS.THREE_DAY_UPTREND,
    });
  }

  // 3-day downtrend
  if (indicators.priceChange3Days <= -3) {
    signals.push({
      type: 'sell',
      category: 'trend',
      name: '3 Gun Ust Uste Dusus',
      description: 'Son 3 gun arka arkaya negatif kapanis',
      points: SIGNAL_POINTS.THREE_DAY_DOWNTREND,
    });
  }

  // ==========================================
  // STOCHASTIC SIGNALS
  // ==========================================
  
  // Stochastic oversold and rising
  if (indicators.stochastic.k < 20 && indicators.stochastic.k > indicators.stochastic.kPrev) {
    signals.push({
      type: 'buy',
      category: 'stochastic',
      name: 'Stochastic Asiri Satim',
      description: `Stochastic %K=${indicators.stochastic.k.toFixed(0)} asiri satim bolgesinden yukseliyor`,
      points: SIGNAL_POINTS.STOCHASTIC_OVERSOLD_RISING,
    });
  }

  // ==========================================
  // ADX SIGNALS
  // ==========================================
  
  // Strong trend
  if (indicators.adx > 25) {
    signals.push({
      type: 'buy',
      category: 'adx',
      name: 'Guclu Trend',
      description: `ADX=${indicators.adx.toFixed(0)} - guclu trend mevcut`,
      points: SIGNAL_POINTS.ADX_STRONG_TREND,
    });
  }

  // ==========================================
  // OBV SIGNALS
  // ==========================================
  
  if (indicators.obvTrend === 'rising') {
    signals.push({
      type: 'buy',
      category: 'obv',
      name: 'OBV Yukseliste',
      description: 'On-Balance Volume son 5 gunde yukseliste',
      points: SIGNAL_POINTS.OBV_RISING,
    });
  }

  // ==========================================
  // PRICE SIGNALS
  // ==========================================
  
  // Near 52-week low
  if (fiftyTwoWeekLow && currentPrice < fiftyTwoWeekLow * 1.15) {
    signals.push({
      type: 'buy',
      category: 'price',
      name: '52 Hafta En Dusuge Yakin',
      description: `Fiyat 52 haftalik en dusuk seviyenin %${((currentPrice / fiftyTwoWeekLow - 1) * 100).toFixed(1)} ustunde`,
      points: SIGNAL_POINTS.NEAR_52_WEEK_LOW,
    });
  }

  // Moderate daily gain (good momentum but not overbought)
  if (dayChangePercent >= 1 && dayChangePercent <= 3) {
    signals.push({
      type: 'buy',
      category: 'price',
      name: 'Olumlu Gunluk Hareket',
      description: `Bugun %${dayChangePercent.toFixed(2)} yukselis - momentum pozitif`,
      points: SIGNAL_POINTS.MODERATE_DAILY_GAIN,
    });
  }

  // Dip buying opportunity
  if (dayChangePercent >= -3 && dayChangePercent <= -1) {
    signals.push({
      type: 'buy',
      category: 'price',
      name: 'Dip Alim Firsati',
      description: `Bugun %${dayChangePercent.toFixed(2)} dusus - potansiyel toparlanma`,
      points: SIGNAL_POINTS.DIP_BUYING_OPPORTUNITY,
    });
  }

  return signals;
}

/**
 * Count buy and sell signals
 */
export function countSignals(signals: Signal[]): { buy: number; sell: number; neutral: number } {
  return signals.reduce(
    (acc, signal) => {
      if (signal.type === 'buy') acc.buy++;
      else if (signal.type === 'sell') acc.sell++;
      else acc.neutral++;
      return acc;
    },
    { buy: 0, sell: 0, neutral: 0 }
  );
}
