// Elite Signal Engine - Akilli Sinyal Motoru
// 1M TL pozisyon icin optimize edilmis

import type { 
  EliteTechnicalIndicators, 
  EliteSignal, 
  SignalCategory,
  ELITE_SIGNAL_POINTS 
} from './elite-scanner-types';

const SIGNAL_POINTS = {
  // === MOMENTUM SINYALLERI ===
  RSI_OVERSOLD_BULLISH_DIVERGENCE: { points: 35, weight: 5, reliability: 85 },
  RSI_OVERSOLD_RISING: { points: 25, weight: 4, reliability: 75 },
  RSI_NEUTRAL_RISING: { points: 10, weight: 2, reliability: 60 },
  RSI_OVERBOUGHT: { points: -20, weight: 3, reliability: 70 },
  RSI_OVERBOUGHT_BEARISH_DIVERGENCE: { points: -35, weight: 5, reliability: 85 },
  
  MACD_BULLISH_CROSS_BELOW_ZERO: { points: 30, weight: 5, reliability: 80 },
  MACD_BULLISH_CROSS_ABOVE_ZERO: { points: 20, weight: 3, reliability: 70 },
  MACD_HISTOGRAM_RISING: { points: 15, weight: 2, reliability: 65 },
  MACD_BULLISH_DIVERGENCE: { points: 35, weight: 5, reliability: 85 },
  MACD_BEARISH_CROSS: { points: -25, weight: 4, reliability: 75 },
  MACD_BEARISH_DIVERGENCE: { points: -35, weight: 5, reliability: 85 },
  
  STOCH_OVERSOLD_BULLISH_CROSS: { points: 25, weight: 4, reliability: 75 },
  STOCH_OVERBOUGHT_BEARISH_CROSS: { points: -25, weight: 4, reliability: 75 },
  
  WILLIAMS_OVERSOLD_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  WILLIAMS_OVERBOUGHT_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  CCI_OVERSOLD_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  CCI_OVERBOUGHT_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  MFI_OVERSOLD: { points: 20, weight: 4, reliability: 75 },
  MFI_OVERBOUGHT: { points: -20, weight: 4, reliability: 75 },
  
  // === TREND SINYALLERI ===
  EMA_PERFECT_BULLISH_ALIGNMENT: { points: 40, weight: 5, reliability: 90 },
  EMA_BULLISH_ALIGNMENT: { points: 25, weight: 4, reliability: 80 },
  EMA_BEARISH_ALIGNMENT: { points: -25, weight: 4, reliability: 80 },
  EMA_PERFECT_BEARISH_ALIGNMENT: { points: -40, weight: 5, reliability: 90 },
  
  PRICE_ABOVE_ALL_EMAS: { points: 30, weight: 4, reliability: 85 },
  PRICE_CROSS_EMA21_UP: { points: 20, weight: 3, reliability: 75 },
  PRICE_CROSS_EMA55_UP: { points: 25, weight: 4, reliability: 80 },
  PRICE_BELOW_ALL_EMAS: { points: -30, weight: 4, reliability: 85 },
  
  ADX_STRONG_BULLISH_TREND: { points: 25, weight: 4, reliability: 80 },
  ADX_WEAK_TREND: { points: 5, weight: 1, reliability: 50 },
  ADX_STRONG_BEARISH_TREND: { points: -25, weight: 4, reliability: 80 },
  
  PSAR_BULLISH_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  PSAR_BEARISH_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  ICHIMOKU_STRONG_BUY: { points: 40, weight: 5, reliability: 90 },
  ICHIMOKU_BUY: { points: 25, weight: 4, reliability: 80 },
  ICHIMOKU_SELL: { points: -25, weight: 4, reliability: 80 },
  ICHIMOKU_STRONG_SELL: { points: -40, weight: 5, reliability: 90 },
  
  // === VOLATILITE SINYALLERI ===
  BB_SQUEEZE_BREAKOUT_UP: { points: 30, weight: 4, reliability: 80 },
  BB_TOUCH_LOWER_REVERSAL: { points: 25, weight: 4, reliability: 75 },
  BB_TOUCH_UPPER_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  ATR_EXPANDING_WITH_TREND: { points: 15, weight: 2, reliability: 65 },
  ATR_CONTRACTING: { points: 10, weight: 2, reliability: 60 },
  
  // === HACIM SINYALLERI ===
  VOLUME_SURGE_WITH_PRICE_UP: { points: 30, weight: 4, reliability: 85 },
  VOLUME_SURGE_WITH_PRICE_DOWN: { points: -25, weight: 4, reliability: 80 },
  VOLUME_CLIMAX_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  LOW_VOLUME_WARNING: { points: -15, weight: 3, reliability: 75 },
  
  OBV_BULLISH_DIVERGENCE: { points: 30, weight: 4, reliability: 80 },
  OBV_BEARISH_DIVERGENCE: { points: -30, weight: 4, reliability: 80 },
  OBV_RISING_TREND: { points: 15, weight: 2, reliability: 65 },
  
  CMF_STRONG_ACCUMULATION: { points: 25, weight: 4, reliability: 80 },
  CMF_STRONG_DISTRIBUTION: { points: -25, weight: 4, reliability: 80 },
  
  // === MUM FORMASYONLARI ===
  PATTERN_BULLISH_ENGULFING: { points: 25, weight: 4, reliability: 75 },
  PATTERN_MORNING_STAR: { points: 30, weight: 4, reliability: 80 },
  PATTERN_THREE_WHITE_SOLDIERS: { points: 35, weight: 5, reliability: 85 },
  PATTERN_HAMMER: { points: 20, weight: 3, reliability: 70 },
  PATTERN_PIERCING_LINE: { points: 20, weight: 3, reliability: 70 },
  PATTERN_TWEEZER_BOTTOM: { points: 20, weight: 3, reliability: 70 },
  PATTERN_DRAGONFLY_DOJI: { points: 20, weight: 3, reliability: 70 },
  
  PATTERN_BEARISH_ENGULFING: { points: -25, weight: 4, reliability: 75 },
  PATTERN_EVENING_STAR: { points: -30, weight: 4, reliability: 80 },
  PATTERN_THREE_BLACK_CROWS: { points: -35, weight: 5, reliability: 85 },
  PATTERN_DARK_CLOUD_COVER: { points: -20, weight: 3, reliability: 70 },
  PATTERN_GRAVESTONE_DOJI: { points: -20, weight: 3, reliability: 70 },
  
  // === DESTEK/DIRENÇ ===
  NEAR_STRONG_SUPPORT: { points: 20, weight: 3, reliability: 75 },
  BREAK_ABOVE_RESISTANCE: { points: 25, weight: 4, reliability: 80 },
  NEAR_52_WEEK_LOW: { points: 15, weight: 2, reliability: 65 },
  BREAK_BELOW_SUPPORT: { points: -25, weight: 4, reliability: 80 },
  NEAR_52_WEEK_HIGH: { points: -10, weight: 2, reliability: 60 },
  
  // === CONFLUENCE BONUSLARI ===
  CONFLUENCE_3_CATEGORIES: { points: 25, weight: 3, reliability: 85 },
  CONFLUENCE_4_CATEGORIES: { points: 35, weight: 4, reliability: 90 },
  CONFLUENCE_5_PLUS_CATEGORIES: { points: 50, weight: 5, reliability: 95 },
  
  // Multi-Timeframe
  MTF_ALL_ALIGNED_BULLISH: { points: 35, weight: 5, reliability: 90 },
  MTF_ALL_ALIGNED_BEARISH: { points: -35, weight: 5, reliability: 90 },
} as const;

let signalIdCounter = 0;

function createSignal(
  type: EliteSignal['type'],
  category: SignalCategory,
  name: string,
  description: string,
  signalKey: keyof typeof SIGNAL_POINTS,
  timeframe: EliteSignal['timeframe'] = 'short'
): EliteSignal {
  const config = SIGNAL_POINTS[signalKey];
  return {
    id: `sig_${++signalIdCounter}`,
    type,
    category,
    name,
    description,
    points: config.points,
    weight: config.weight,
    reliability: config.reliability,
    timeframe,
  };
}

export function analyzeEliteSignals(
  indicators: EliteTechnicalIndicators,
  currentPrice: number,
  dayChangePercent: number
): EliteSignal[] {
  const signals: EliteSignal[] = [];
  signalIdCounter = 0;
  
  // ==========================================
  // RSI SINYALLERI
  // ==========================================
  
  if (indicators.rsi.divergence === 'bullish' && indicators.rsi.current < 40) {
    signals.push(createSignal(
      'strong_buy', 'momentum',
      'RSI Yukari Diverjans',
      `RSI ${indicators.rsi.current.toFixed(1)} - Fiyat dusuk yapiyor ama RSI daha yukari dipler yapiyor. Guclu donus sinyali.`,
      'RSI_OVERSOLD_BULLISH_DIVERGENCE',
      'medium'
    ));
  } else if (indicators.rsi.current < 30 && indicators.rsi.current > indicators.rsi.previous) {
    signals.push(createSignal(
      'buy', 'momentum',
      'RSI Asiri Satim Toparlaniyor',
      `RSI ${indicators.rsi.current.toFixed(1)} asiri satim bolgesinden yukseliyor`,
      'RSI_OVERSOLD_RISING'
    ));
  } else if (indicators.rsi.current >= 30 && indicators.rsi.current <= 50 && indicators.rsi.current > indicators.rsi.previous) {
    signals.push(createSignal(
      'buy', 'momentum',
      'RSI Momentum Artisi',
      `RSI ${indicators.rsi.current.toFixed(1)} yukseliste`,
      'RSI_NEUTRAL_RISING'
    ));
  }
  
  if (indicators.rsi.divergence === 'bearish' && indicators.rsi.current > 60) {
    signals.push(createSignal(
      'strong_sell', 'momentum',
      'RSI Asagi Diverjans',
      `RSI ${indicators.rsi.current.toFixed(1)} - Fiyat yuksek yapiyor ama RSI daha dusuk tepeler. TEHLIKE!`,
      'RSI_OVERBOUGHT_BEARISH_DIVERGENCE',
      'medium'
    ));
  } else if (indicators.rsi.current > 75) {
    signals.push(createSignal(
      'sell', 'momentum',
      'RSI Asiri Alim',
      `RSI ${indicators.rsi.current.toFixed(1)} asiri alim bolgesinde - geri cekilme riski`,
      'RSI_OVERBOUGHT'
    ));
  }
  
  // ==========================================
  // MACD SINYALLERI
  // ==========================================
  
  if (indicators.macd.divergence === 'bullish') {
    signals.push(createSignal(
      'strong_buy', 'momentum',
      'MACD Yukari Diverjans',
      'Fiyat dusuk yaparken MACD yukari dipler yapiyor - guclu alim sinyali',
      'MACD_BULLISH_DIVERGENCE',
      'medium'
    ));
  } else if (indicators.macd.crossover === 'bullish' && indicators.macd.macdLine < 0) {
    signals.push(createSignal(
      'strong_buy', 'momentum',
      'MACD Altin Kesisim (Sifir Alti)',
      'MACD sifirin altinda yukari kesiyor - guclu momentum baslangici',
      'MACD_BULLISH_CROSS_BELOW_ZERO'
    ));
  } else if (indicators.macd.crossover === 'bullish') {
    signals.push(createSignal(
      'buy', 'momentum',
      'MACD Yukari Kesisim',
      'MACD sinyal cizgisini yukari kesiyor',
      'MACD_BULLISH_CROSS_ABOVE_ZERO'
    ));
  } else if (indicators.macd.histogram > indicators.macd.histogramPrev && indicators.macd.histogram > 0) {
    signals.push(createSignal(
      'buy', 'momentum',
      'MACD Histogram Artisi',
      'MACD histogram genisliyor - momentum artisi',
      'MACD_HISTOGRAM_RISING'
    ));
  }
  
  if (indicators.macd.divergence === 'bearish') {
    signals.push(createSignal(
      'strong_sell', 'momentum',
      'MACD Asagi Diverjans',
      'Fiyat yuksek yaparken MACD dusuk tepeler - satis sinyali',
      'MACD_BEARISH_DIVERGENCE',
      'medium'
    ));
  } else if (indicators.macd.crossover === 'bearish') {
    signals.push(createSignal(
      'sell', 'momentum',
      'MACD Asagi Kesisim',
      'MACD sinyal cizgisini asagi kesiyor',
      'MACD_BEARISH_CROSS'
    ));
  }
  
  // ==========================================
  // STOCHASTIC SINYALLERI
  // ==========================================
  
  if (indicators.stochastic.k < 20 && indicators.stochastic.crossover === 'bullish') {
    signals.push(createSignal(
      'buy', 'momentum',
      'Stochastic Asiri Satim Kesisimi',
      `%K=${indicators.stochastic.k.toFixed(0)} asiri satim bolgesinde yukari kesiyor`,
      'STOCH_OVERSOLD_BULLISH_CROSS'
    ));
  }
  
  if (indicators.stochastic.k > 80 && indicators.stochastic.crossover === 'bearish') {
    signals.push(createSignal(
      'sell', 'momentum',
      'Stochastic Asiri Alim Kesisimi',
      `%K=${indicators.stochastic.k.toFixed(0)} asiri alim bolgesinde asagi kesiyor`,
      'STOCH_OVERBOUGHT_BEARISH_CROSS'
    ));
  }
  
  // ==========================================
  // WILLIAMS %R
  // ==========================================
  
  if (indicators.williamsR < -80 && indicators.williamsR > -90) {
    signals.push(createSignal(
      'buy', 'momentum',
      'Williams %R Asiri Satim',
      `Williams %R = ${indicators.williamsR.toFixed(0)} asiri satim bolgesinde`,
      'WILLIAMS_OVERSOLD_REVERSAL'
    ));
  }
  
  if (indicators.williamsR > -20 && indicators.williamsR < -10) {
    signals.push(createSignal(
      'sell', 'momentum',
      'Williams %R Asiri Alim',
      `Williams %R = ${indicators.williamsR.toFixed(0)} asiri alim bolgesinde`,
      'WILLIAMS_OVERBOUGHT_REVERSAL'
    ));
  }
  
  // ==========================================
  // CCI
  // ==========================================
  
  if (indicators.cci < -100 && indicators.cci > -200) {
    signals.push(createSignal(
      'buy', 'momentum',
      'CCI Asiri Satim',
      `CCI = ${indicators.cci.toFixed(0)} asiri satim bolgesinde`,
      'CCI_OVERSOLD_REVERSAL'
    ));
  }
  
  if (indicators.cci > 100 && indicators.cci < 200) {
    signals.push(createSignal(
      'sell', 'momentum',
      'CCI Asiri Alim',
      `CCI = ${indicators.cci.toFixed(0)} asiri alim bolgesinde`,
      'CCI_OVERBOUGHT_REVERSAL'
    ));
  }
  
  // ==========================================
  // MFI
  // ==========================================
  
  if (indicators.mfi < 20) {
    signals.push(createSignal(
      'buy', 'momentum',
      'MFI Asiri Satim',
      `MFI = ${indicators.mfi.toFixed(0)} - para akisi cok dusuk, toparlanma bekleniyor`,
      'MFI_OVERSOLD'
    ));
  }
  
  if (indicators.mfi > 80) {
    signals.push(createSignal(
      'sell', 'momentum',
      'MFI Asiri Alim',
      `MFI = ${indicators.mfi.toFixed(0)} - para akisi cok yuksek, geri cekilme riski`,
      'MFI_OVERBOUGHT'
    ));
  }
  
  // ==========================================
  // EMA ALIGNMENT
  // ==========================================
  
  if (indicators.ema.alignment === 'perfect_bullish') {
    signals.push(createSignal(
      'strong_buy', 'trend',
      'Mukemmel EMA Dizilimi',
      'Tum EMA\'lar mukemmel yukari sirali (5>8>13>21>34>55>89>200)',
      'EMA_PERFECT_BULLISH_ALIGNMENT',
      'long'
    ));
  } else if (indicators.ema.alignment === 'bullish') {
    signals.push(createSignal(
      'buy', 'trend',
      'Yukari EMA Dizilimi',
      'EMA\'lar yukari sirali - trend yukarida',
      'EMA_BULLISH_ALIGNMENT',
      'medium'
    ));
  } else if (indicators.ema.alignment === 'perfect_bearish') {
    signals.push(createSignal(
      'strong_sell', 'trend',
      'Mukemmel Asagi EMA Dizilimi',
      'Tum EMA\'lar asagi sirali - guclu dusus trendi',
      'EMA_PERFECT_BEARISH_ALIGNMENT',
      'long'
    ));
  } else if (indicators.ema.alignment === 'bearish') {
    signals.push(createSignal(
      'sell', 'trend',
      'Asagi EMA Dizilimi',
      'EMA\'lar asagi sirali - trend asagida',
      'EMA_BEARISH_ALIGNMENT',
      'medium'
    ));
  }
  
  // Price vs EMAs
  if (currentPrice > indicators.ema.ema21 && 
      currentPrice > indicators.ema.ema55 && 
      currentPrice > indicators.ema.ema200) {
    signals.push(createSignal(
      'buy', 'trend',
      'Fiyat Tum EMA\'larin Ustunde',
      'Fiyat 21, 55 ve 200 EMA\'nin ustunde - guclu trend',
      'PRICE_ABOVE_ALL_EMAS',
      'medium'
    ));
  }
  
  if (currentPrice < indicators.ema.ema21 && 
      currentPrice < indicators.ema.ema55 && 
      currentPrice < indicators.ema.ema200) {
    signals.push(createSignal(
      'sell', 'trend',
      'Fiyat Tum EMA\'larin Altinda',
      'Fiyat 21, 55 ve 200 EMA\'nin altinda - zayif',
      'PRICE_BELOW_ALL_EMAS',
      'medium'
    ));
  }
  
  // ==========================================
  // ADX
  // ==========================================
  
  if (indicators.adx.trend === 'strong_up') {
    signals.push(createSignal(
      'buy', 'trend',
      'Guclu Yukari Trend (ADX)',
      `ADX=${indicators.adx.value.toFixed(0)}, +DI=${indicators.adx.plusDI.toFixed(0)} - cok guclu yukari trend`,
      'ADX_STRONG_BULLISH_TREND',
      'medium'
    ));
  } else if (indicators.adx.trend === 'up') {
    signals.push(createSignal(
      'buy', 'trend',
      'Yukari Trend (ADX)',
      `ADX=${indicators.adx.value.toFixed(0)} yukari trend`,
      'ADX_STRONG_BULLISH_TREND'
    ));
  } else if (indicators.adx.trend === 'strong_down') {
    signals.push(createSignal(
      'sell', 'trend',
      'Guclu Asagi Trend (ADX)',
      `ADX=${indicators.adx.value.toFixed(0)}, -DI=${indicators.adx.minusDI.toFixed(0)} - guclu dusus`,
      'ADX_STRONG_BEARISH_TREND',
      'medium'
    ));
  } else if (indicators.adx.trend === 'weak') {
    signals.push(createSignal(
      'neutral', 'trend',
      'Zayif Trend (ADX)',
      `ADX=${indicators.adx.value.toFixed(0)} - net trend yok`,
      'ADX_WEAK_TREND'
    ));
  }
  
  // ==========================================
  // PARABOLIC SAR
  // ==========================================
  
  if (indicators.parabolicSar.reversal && indicators.parabolicSar.trend === 'bullish') {
    signals.push(createSignal(
      'buy', 'trend',
      'Parabolic SAR Yukari Donus',
      'SAR asagidan yukariya gecti - trend donusu',
      'PSAR_BULLISH_REVERSAL'
    ));
  }
  
  if (indicators.parabolicSar.reversal && indicators.parabolicSar.trend === 'bearish') {
    signals.push(createSignal(
      'sell', 'trend',
      'Parabolic SAR Asagi Donus',
      'SAR yukaridan asagiya gecti - trend donusu',
      'PSAR_BEARISH_REVERSAL'
    ));
  }
  
  // ==========================================
  // ICHIMOKU
  // ==========================================
  
  if (indicators.ichimoku.signal === 'strong_buy') {
    signals.push(createSignal(
      'strong_buy', 'ichimoku',
      'Ichimoku Guclu Alim',
      'Fiyat bulutun ustunde, Tenkan>Kijun, bulut yesil - ideal kosullar',
      'ICHIMOKU_STRONG_BUY',
      'long'
    ));
  } else if (indicators.ichimoku.signal === 'buy') {
    signals.push(createSignal(
      'buy', 'ichimoku',
      'Ichimoku Alim',
      'Ichimoku alim sinyali veriyor',
      'ICHIMOKU_BUY',
      'medium'
    ));
  } else if (indicators.ichimoku.signal === 'strong_sell') {
    signals.push(createSignal(
      'strong_sell', 'ichimoku',
      'Ichimoku Guclu Satis',
      'Fiyat bulutun altinda, tum kosullar negatif',
      'ICHIMOKU_STRONG_SELL',
      'long'
    ));
  } else if (indicators.ichimoku.signal === 'sell') {
    signals.push(createSignal(
      'sell', 'ichimoku',
      'Ichimoku Satis',
      'Ichimoku satis sinyali veriyor',
      'ICHIMOKU_SELL',
      'medium'
    ));
  }
  
  // ==========================================
  // BOLLINGER BANDS
  // ==========================================
  
  if (indicators.bollingerBands.squeeze && dayChangePercent > 1) {
    signals.push(createSignal(
      'buy', 'volatility',
      'Bollinger Squeeze Kirilimi',
      'Bandlar sikilmis, yukari kirilim basladi - buyuk hareket bekleniyor',
      'BB_SQUEEZE_BREAKOUT_UP'
    ));
  }
  
  if (indicators.bollingerBands.percentB < 5 && dayChangePercent > 0) {
    signals.push(createSignal(
      'buy', 'volatility',
      'Bollinger Alt Banda Dokunma',
      `%B = ${indicators.bollingerBands.percentB.toFixed(0)} - alt banda dokundu, toparlanma bekleniyor`,
      'BB_TOUCH_LOWER_REVERSAL'
    ));
  }
  
  if (indicators.bollingerBands.percentB > 95 && dayChangePercent < 0) {
    signals.push(createSignal(
      'sell', 'volatility',
      'Bollinger Ust Banda Dokunma',
      `%B = ${indicators.bollingerBands.percentB.toFixed(0)} - ust banda dokundu, geri cekilme riski`,
      'BB_TOUCH_UPPER_REVERSAL'
    ));
  }
  
  // ==========================================
  // VOLUME SINYALLERI
  // ==========================================
  
  if (indicators.volume.trend === 'very_high' && dayChangePercent > 1) {
    signals.push(createSignal(
      'strong_buy', 'volume',
      'Cok Yuksek Hacimle Yukselis',
      `Hacim ortalamanin ${indicators.volume.ratio.toFixed(1)}x kati - kurumsal alim`,
      'VOLUME_SURGE_WITH_PRICE_UP'
    ));
  } else if (indicators.volume.trend === 'high' && dayChangePercent > 0.5) {
    signals.push(createSignal(
      'buy', 'volume',
      'Yuksek Hacimle Yukselis',
      `Hacim ortalamanin ${indicators.volume.ratio.toFixed(1)}x kati`,
      'VOLUME_SURGE_WITH_PRICE_UP'
    ));
  }
  
  if (indicators.volume.trend === 'very_high' && dayChangePercent < -1) {
    signals.push(createSignal(
      'sell', 'volume',
      'Cok Yuksek Hacimle Dusus',
      `Hacim ortalamanin ${indicators.volume.ratio.toFixed(1)}x kati - satis baskisi`,
      'VOLUME_SURGE_WITH_PRICE_DOWN'
    ));
  }
  
  if (indicators.volume.trend === 'very_low' || indicators.volume.trend === 'low') {
    signals.push(createSignal(
      'neutral', 'volume',
      'Dusuk Hacim Uyarisi',
      `Hacim ortalamanin ${(indicators.volume.ratio * 100).toFixed(0)}%'i - likidite riski`,
      'LOW_VOLUME_WARNING'
    ));
  }
  
  // OBV
  if (indicators.obv.divergence === 'bullish') {
    signals.push(createSignal(
      'buy', 'volume',
      'OBV Yukari Diverjans',
      'Fiyat dusuk yaparken hacim birikimi var',
      'OBV_BULLISH_DIVERGENCE',
      'medium'
    ));
  } else if (indicators.obv.trend === 'rising') {
    signals.push(createSignal(
      'buy', 'volume',
      'OBV Yukseliste',
      'On-Balance Volume yukseliste - alim baskisi',
      'OBV_RISING_TREND'
    ));
  }
  
  if (indicators.obv.divergence === 'bearish') {
    signals.push(createSignal(
      'sell', 'volume',
      'OBV Asagi Diverjans',
      'Fiyat yuksek yaparken hacim dagilimi var',
      'OBV_BEARISH_DIVERGENCE',
      'medium'
    ));
  }
  
  // Chaikin Money Flow
  if (indicators.chaikinMF > 0.2) {
    signals.push(createSignal(
      'buy', 'volume',
      'Guclu Para Girisi (CMF)',
      `CMF = ${indicators.chaikinMF.toFixed(2)} - guclu birikim`,
      'CMF_STRONG_ACCUMULATION'
    ));
  }
  
  if (indicators.chaikinMF < -0.2) {
    signals.push(createSignal(
      'sell', 'volume',
      'Guclu Para Cikisi (CMF)',
      `CMF = ${indicators.chaikinMF.toFixed(2)} - guclu dagilim`,
      'CMF_STRONG_DISTRIBUTION'
    ));
  }
  
  // ==========================================
  // MUM FORMASYONLARI
  // ==========================================
  
  if (indicators.candlePattern.pattern) {
    const pattern = indicators.candlePattern.pattern;
    const strength = indicators.candlePattern.strength;
    
    const bullishPatterns: Record<string, string> = {
      'bullish_engulfing': 'Yukari Yutan Formasyon',
      'morning_star': 'Sabah Yildizi',
      'three_white_soldiers': 'Uc Beyaz Asker',
      'hammer': 'Cekic',
      'piercing_line': 'Delici Cizgi',
      'tweezer_bottom': 'Cift Dip',
      'dragonfly_doji': 'Yusufcuk Doji',
      'inverted_hammer': 'Ters Cekic',
      'bullish_harami': 'Yukari Harami',
    };
    
    const bearishPatterns: Record<string, string> = {
      'bearish_engulfing': 'Asagi Yutan Formasyon',
      'evening_star': 'Aksam Yildizi',
      'three_black_crows': 'Uc Kara Karga',
      'dark_cloud_cover': 'Kara Bulut',
      'gravestone_doji': 'Mezar Tasi Doji',
      'bearish_harami': 'Asagi Harami',
      'tweezer_top': 'Cift Tepe',
    };
    
    if (bullishPatterns[pattern]) {
      const signalType = strength >= 5 ? 'strong_buy' : strength >= 4 ? 'buy' : 'neutral';
      const signalKey = pattern === 'three_white_soldiers' ? 'PATTERN_THREE_WHITE_SOLDIERS' :
                        pattern === 'bullish_engulfing' ? 'PATTERN_BULLISH_ENGULFING' :
                        pattern === 'morning_star' ? 'PATTERN_MORNING_STAR' :
                        pattern === 'hammer' ? 'PATTERN_HAMMER' :
                        'PATTERN_BULLISH_ENGULFING';
      
      signals.push(createSignal(
        signalType, 'pattern',
        bullishPatterns[pattern],
        `Mum formasyonu: ${bullishPatterns[pattern]} (Guc: ${strength}/5)`,
        signalKey as keyof typeof SIGNAL_POINTS
      ));
    }
    
    if (bearishPatterns[pattern]) {
      const signalType = strength >= 5 ? 'strong_sell' : strength >= 4 ? 'sell' : 'neutral';
      const signalKey = pattern === 'three_black_crows' ? 'PATTERN_THREE_BLACK_CROWS' :
                        pattern === 'bearish_engulfing' ? 'PATTERN_BEARISH_ENGULFING' :
                        pattern === 'evening_star' ? 'PATTERN_EVENING_STAR' :
                        'PATTERN_BEARISH_ENGULFING';
      
      signals.push(createSignal(
        signalType, 'pattern',
        bearishPatterns[pattern],
        `Mum formasyonu: ${bearishPatterns[pattern]} (Guc: ${strength}/5)`,
        signalKey as keyof typeof SIGNAL_POINTS
      ));
    }
  }
  
  // ==========================================
  // DESTEK/DIRENC
  // ==========================================
  
  // Pivot destek
  if (currentPrice > indicators.pivotPoints.s1 * 0.99 && currentPrice < indicators.pivotPoints.s1 * 1.01) {
    signals.push(createSignal(
      'buy', 'support_resistance',
      'Pivot S1 Desteginde',
      `Fiyat ${indicators.pivotPoints.s1.toFixed(2)} pivot destegine yakin`,
      'NEAR_STRONG_SUPPORT'
    ));
  }
  
  // 52 hafta en dusuk
  if (indicators.pricePosition.distanceFrom52Low < 10) {
    signals.push(createSignal(
      'buy', 'support_resistance',
      '52 Hafta En Dusuge Yakin',
      `52 hafta en dusugune %${indicators.pricePosition.distanceFrom52Low.toFixed(1)} uzaklikta`,
      'NEAR_52_WEEK_LOW',
      'long'
    ));
  }
  
  // 52 hafta en yuksek
  if (indicators.pricePosition.distanceFrom52High < 5) {
    signals.push(createSignal(
      'neutral', 'support_resistance',
      '52 Hafta En Yuksege Yakin',
      `52 hafta en yuksegine %${indicators.pricePosition.distanceFrom52High.toFixed(1)} uzaklikta`,
      'NEAR_52_WEEK_HIGH',
      'long'
    ));
  }
  
  // ==========================================
  // MULTI-TIMEFRAME
  // ==========================================
  
  if (indicators.dailyTrend === 'up' && indicators.weeklyTrend === 'up') {
    signals.push(createSignal(
      'buy', 'multi_timeframe',
      'Coklu Zaman Dilimi Uyumu',
      'Gunluk ve haftalik trendler yukari - guclu onay',
      'MTF_ALL_ALIGNED_BULLISH',
      'long'
    ));
  }
  
  if (indicators.dailyTrend === 'down' && indicators.weeklyTrend === 'down') {
    signals.push(createSignal(
      'sell', 'multi_timeframe',
      'Coklu Zaman Dilimi Uyumu (Asagi)',
      'Gunluk ve haftalik trendler asagi - zayif',
      'MTF_ALL_ALIGNED_BEARISH',
      'long'
    ));
  }
  
  // ==========================================
  // CONFLUENCE BONUSLARI
  // ==========================================
  
  const buySignals = signals.filter(s => s.type === 'buy' || s.type === 'strong_buy');
  const uniqueBuyCategories = new Set(buySignals.map(s => s.category));
  
  if (uniqueBuyCategories.size >= 5) {
    signals.push(createSignal(
      'strong_buy', 'multi_timeframe',
      'Mukemmel Confluence (5+ Kategori)',
      `${uniqueBuyCategories.size} farkli kategoriden alim sinyali - cok guclu`,
      'CONFLUENCE_5_PLUS_CATEGORIES',
      'medium'
    ));
  } else if (uniqueBuyCategories.size >= 4) {
    signals.push(createSignal(
      'buy', 'multi_timeframe',
      'Guclu Confluence (4 Kategori)',
      `${uniqueBuyCategories.size} farkli kategoriden alim sinyali`,
      'CONFLUENCE_4_CATEGORIES',
      'medium'
    ));
  } else if (uniqueBuyCategories.size >= 3) {
    signals.push(createSignal(
      'buy', 'multi_timeframe',
      'Iyi Confluence (3 Kategori)',
      `${uniqueBuyCategories.size} farkli kategoriden alim sinyali`,
      'CONFLUENCE_3_CATEGORIES'
    ));
  }
  
  return signals;
}

export function summarizeSignals(signals: EliteSignal[]): {
  strongBuyCount: number;
  buyCount: number;
  neutralCount: number;
  sellCount: number;
  strongSellCount: number;
  netScore: number;
} {
  let strongBuyCount = 0;
  let buyCount = 0;
  let neutralCount = 0;
  let sellCount = 0;
  let strongSellCount = 0;
  let netScore = 0;
  
  for (const signal of signals) {
    netScore += signal.points * (signal.weight / 5);
    
    switch (signal.type) {
      case 'strong_buy': strongBuyCount++; break;
      case 'buy': buyCount++; break;
      case 'neutral': neutralCount++; break;
      case 'sell': sellCount++; break;
      case 'strong_sell': strongSellCount++; break;
    }
  }
  
  return {
    strongBuyCount,
    buyCount,
    neutralCount,
    sellCount,
    strongSellCount,
    netScore: Math.round(netScore * 10) / 10,
  };
}
