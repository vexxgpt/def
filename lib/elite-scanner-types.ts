// Elite Pro Scanner - Dunya Standartlarinda Teknik Analiz Tip Tanimlamalari
// 1M TL pozisyon icin tasarlandi - Sifir hata toleransi

export interface HistoricalBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ==========================================
// SABAH YESIL YAKMA ANALIZI - PRO TRADER
// ==========================================

export interface MorningGreenAnalysis {
  // Son 5 gunluk sabah performansi
  last5Days: {
    date: string;
    prevClose: number;
    open: number;
    gapPercent: number; // Acilis gapi %
    morningHigh: number; // Ilk 30 dk en yuksek
    morningGreen: boolean; // Sabah yesil mi
    closedGreen: boolean; // Gun yesil mi kapandi
    afternoonReversal: boolean; // 17:45 sonrasi ters mi dondü
  }[];
  
  // Sabah Yesil Yakma Skoru (0-100)
  morningGreenScore: number;
  
  // Istatistikler
  stats: {
    // Son 5 gun
    greenMornings5d: number; // Kac kez sabah yesil
    greenMorningRate5d: number; // % oran
    
    // Son 10 gun
    greenMornings10d: number;
    greenMorningRate10d: number;
    
    // Son 20 gun (1 ay)
    greenMornings20d: number;
    greenMorningRate20d: number;
    
    // Tutarlilik
    avgMorningGap: number; // Ortalama sabah gapi %
    avgMorningMove: number; // Ortalama sabah hareketi %
    
    // 17:45 Sonrasi Guvenirligi
    afternoonGreenToMorningRed: number; // 17:45 yesil -> sabah kirmizi kac kez
    afternoonGreenToMorningGreen: number; // 17:45 yesil -> sabah yesil kac kez
    afternoonReliability: number; // % guvenirlik
    
    // Gap Fill Analizi
    gapFillRate: number; // Gap'lerin kapanma orani
    avgGapFillTime: number; // Ortalama gap kapanma suresi (dakika)
  };
  
  // Sabah Stratejisi Onerisi
  strategy: {
    recommendation: 'STRONG_MORNING_BUY' | 'MORNING_BUY' | 'WAIT_FOR_DIP' | 'AVOID_MORNING' | 'SHORT_CANDIDATE';
    confidence: number;
    reasoning: string[];
    optimalEntry: {
      type: 'PREMARKET' | 'OPEN' | 'FIRST_PULLBACK' | 'BREAKOUT';
      priceLevel?: number;
      timeWindow?: string;
    };
  };
  
  // Pattern Tespiti
  patterns: {
    consecutiveGreenMornings: number; // Ust uste kac gun yesil sabah
    isHotStreak: boolean; // 3+ gun ust uste yesil
    hasMomentum: boolean; // Artan momentum
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    priceAcceleration: boolean; // Fiyat ivmeleniyor mu
  };
}

// Gap Up/Down Analizi
export interface GapAnalysis {
  currentGap: {
    percent: number;
    type: 'gap_up' | 'gap_down' | 'flat';
    size: 'large' | 'medium' | 'small' | 'none';
  };
  
  historicalGaps: {
    avgGapUp: number;
    avgGapDown: number;
    gapUpFrequency: number; // Son 20 gunde kac kez gap up
    gapDownFrequency: number;
    largeGapUpSuccess: number; // Buyuk gap up sonrasi basari orani
  };
  
  gapFillProbability: number; // Bu gapin kapanma olasiligi
}

// Momentum Surge Detection (Trade Ideas tarzi)
export interface MomentumSurge {
  detected: boolean;
  type: 'breakout' | 'continuation' | 'reversal' | 'none';
  strength: number; // 0-100
  volumeMultiple: number; // Ortalamaya gore kac kat hacim
  priceMove: number; // Son 5 dakika % hareket
  
  // AI Tahmini
  prediction: {
    direction: 'up' | 'down' | 'neutral';
    targetPercent: number;
    confidence: number;
    timeHorizon: '15min' | '30min' | '1hour' | '1day';
  };
}

// Dark Pool / Buyuk Oyuncu Aktivitesi (Moon Scanner tarzi)
export interface SmartMoneyActivity {
  // Buyuk islemler
  largeTransactions: {
    count: number;
    totalVolume: number;
    netDirection: 'buying' | 'selling' | 'neutral';
    avgSize: number;
  };
  
  // Kurumsal Akis
  institutionalFlow: {
    score: number; // -100 to +100
    trend: 'accumulation' | 'distribution' | 'neutral';
    strength: 'strong' | 'moderate' | 'weak';
  };
  
  // Unusual Activity
  unusualActivity: {
    detected: boolean;
    type: 'volume_spike' | 'price_spike' | 'both' | 'none';
    magnitude: number;
  };
}

// Genisletilmis Teknik Indikatorler
export interface EliteTechnicalIndicators {
  // Momentum Indikatorleri
  rsi: {
    current: number;
    previous: number;
    sma: number; // RSI uzerinden SMA - divergence icin
    divergence: 'bullish' | 'bearish' | 'none';
  };
  
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    histogramPrev: number;
    crossover: 'bullish' | 'bearish' | 'none';
    divergence: 'bullish' | 'bearish' | 'none';
  };
  
  stochastic: {
    k: number;
    d: number;
    kPrev: number;
    crossover: 'bullish' | 'bearish' | 'none';
  };
  
  williamsR: number; // -100 to 0
  
  cci: number; // Commodity Channel Index
  
  mfi: number; // Money Flow Index (0-100)
  
  // Trend Indikatorleri
  ema: {
    ema5: number;
    ema8: number;
    ema13: number;
    ema21: number;
    ema34: number;
    ema55: number;
    ema89: number;
    ema200: number;
    alignment: 'perfect_bullish' | 'bullish' | 'mixed' | 'bearish' | 'perfect_bearish';
  };
  
  sma: {
    sma10: number;
    sma20: number;
    sma50: number;
    sma100: number;
    sma200: number;
  };
  
  adx: {
    value: number;
    plusDI: number;
    minusDI: number;
    trend: 'strong_up' | 'up' | 'weak' | 'down' | 'strong_down';
  };
  
  parabolicSar: {
    value: number;
    trend: 'bullish' | 'bearish';
    reversal: boolean;
  };
  
  ichimoku: {
    tenkan: number; // Conversion Line (9)
    kijun: number; // Base Line (26)
    senkouA: number; // Leading Span A
    senkouB: number; // Leading Span B
    chikou: number; // Lagging Span
    cloudTop: number;
    cloudBottom: number;
    signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  };
  
  // Volatilite Indikatorleri
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
    bandwidth: number; // Volatilite olcusu
    squeeze: boolean; // Squeeze durumu
  };
  
  atr: {
    value: number;
    percent: number; // ATR / Fiyat
    trend: 'expanding' | 'contracting' | 'stable';
  };
  
  keltnerChannels: {
    upper: number;
    middle: number;
    lower: number;
  };
  
  // Hacim Indikatorleri
  volume: {
    current: number;
    sma20: number;
    ratio: number; // Current / SMA20
    trend: 'very_high' | 'high' | 'normal' | 'low' | 'very_low';
  };
  
  obv: {
    value: number;
    trend: 'rising' | 'falling' | 'flat';
    divergence: 'bullish' | 'bearish' | 'none';
  };
  
  vwap: number; // Volume Weighted Average Price
  
  chaikinMF: number; // Chaikin Money Flow (-1 to 1)
  
  accDist: {
    value: number;
    trend: 'accumulation' | 'distribution' | 'neutral';
  };
  
  // Destek/Direnç Seviyeleri
  pivotPoints: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
  
  fibonacciLevels: {
    high: number;
    low: number;
    level236: number;
    level382: number;
    level500: number;
    level618: number;
    level786: number;
  };
  
  // Mum Formasyonlari
  candlePattern: {
    pattern: CandlePattern | null;
    strength: number; // 1-5
    direction: 'bullish' | 'bearish' | 'neutral';
  };
  
  // Multi-Timeframe
  dailyTrend: 'up' | 'down' | 'sideways';
  weeklyTrend: 'up' | 'down' | 'sideways';
  
  // Ek Metrikler
  pricePosition: {
    inRange52Week: number; // 0-100
    distanceFrom52High: number;
    distanceFrom52Low: number;
    distance200SMA: number;
  };
  
  momentum: {
    roc5: number; // Rate of Change 5 gun
    roc10: number;
    roc20: number;
  };
}

export type CandlePattern = 
  | 'doji'
  | 'hammer'
  | 'inverted_hammer'
  | 'bullish_engulfing'
  | 'bearish_engulfing'
  | 'morning_star'
  | 'evening_star'
  | 'three_white_soldiers'
  | 'three_black_crows'
  | 'piercing_line'
  | 'dark_cloud_cover'
  | 'bullish_harami'
  | 'bearish_harami'
  | 'tweezer_bottom'
  | 'tweezer_top'
  | 'spinning_top'
  | 'marubozu_bullish'
  | 'marubozu_bearish'
  | 'dragonfly_doji'
  | 'gravestone_doji';

export interface EliteSignal {
  id: string;
  type: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  category: SignalCategory;
  name: string;
  description: string;
  points: number;
  weight: number; // 1-5 onem derecesi
  reliability: number; // 0-100 guvenilirlik
  timeframe: 'short' | 'medium' | 'long';
}

export type SignalCategory = 
  | 'momentum'
  | 'trend'
  | 'volatility'
  | 'volume'
  | 'pattern'
  | 'support_resistance'
  | 'divergence'
  | 'ichimoku'
  | 'multi_timeframe';

export interface EliteRiskAnalysis {
  score: number; // 1-100 (dusuk = az risk)
  level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'extreme';
  
  // Detayli Risk Faktorleri
  factors: {
    volatilityRisk: number;
    liquidityRisk: number;
    trendRisk: number;
    overextensionRisk: number;
    newsRisk: number;
  };
  
  warnings: string[];
  dealBreakers: string[]; // Bu varsa ASLA girme
  
  // Pozisyon Boyutlandirma
  recommendedPositionSize: number; // 0-100 (sermayenin yuzdesi)
  maxPositionSize: number;
  kellyPercentage: number;
  
  // Stop Loss Onerileri
  stopLossLevels: {
    tight: { price: number; percent: number };
    normal: { price: number; percent: number };
    wide: { price: number; percent: number };
  };
}

export interface EliteTargetAnalysis {
  // Hedef Fiyatlar
  targets: {
    conservative: { price: number; percent: number; probability: number };
    moderate: { price: number; percent: number; probability: number };
    aggressive: { price: number; percent: number; probability: number };
  };
  
  // Teknik Hedefler
  technicalTargets: {
    pivotR1: number;
    bollingerMiddle: number;
    bollingerUpper: number;
    atrTarget: number;
    fibTarget382: number;
    fibTarget618: number;
  };
  
  // Risk/Odul
  riskRewardRatios: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
  
  // Zaman Tahmini
  expectedTimeframe: 'intraday' | '1-3_days' | '1_week' | '2_weeks' | '1_month';
}

export interface EliteScanResult {
  symbol: string;
  name: string;
  sector: string;
  
  // Fiyat Bilgileri
  price: {
    current: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    change: number;
    changePercent: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  
  // Hacim
  volume: {
    current: number;
    average20: number;
    ratio: number;
  };
  
  // Teknik Analiz
  indicators: EliteTechnicalIndicators;
  
  // Sinyaller
  signals: EliteSignal[];
  signalSummary: {
    strongBuyCount: number;
    buyCount: number;
    neutralCount: number;
    sellCount: number;
    strongSellCount: number;
    netScore: number;
  };
  
  // Puanlama
  score: {
    technical: number; // 0-100
    momentum: number;
    trend: number;
    volume: number;
    pattern: number;
    overall: number; // Ana skor
    confidence: number; // Guven yuzdesi
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  };
  
  // Risk Analizi
  risk: EliteRiskAnalysis;
  
  // Hedef Analizi
  target: EliteTargetAnalysis;
  
  // Karar
  decision: {
    action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' | 'SELL';
    reasoning: string[];
    conviction: number; // 0-100
    proAnalysis?: {
      confluenceScore: number;
      trendAlignment: number;
      momentumQuality: number;
      riskAdjustedReturn: number;
      institutionalSignal: 'strong' | 'moderate' | 'weak' | 'none';
      marketTiming: 'optimal' | 'good' | 'neutral' | 'poor';
      entryQuality: 'A' | 'B' | 'C' | 'D' | 'F';
    };
  };
  
  // Meta
  lastUpdated: Date;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Pro Skorlama (TradingView tarzinda)
  compositeScore?: number; // 0-100
  signalStrength?: {
    strength: number;
    label: 'GUCLU AL' | 'AL' | 'NOTR' | 'SAT' | 'GUCLU SAT';
    oscillators: { buy: number; neutral: number; sell: number };
    movingAverages: { buy: number; neutral: number; sell: number };
    summary: { buy: number; neutral: number; sell: number };
  };
  
  // SABAH YESIL YAKMA ANALIZI
  morningGreen?: MorningGreenAnalysis;
  
  // GAP ANALIZI
  gapAnalysis?: GapAnalysis;
  
  // MOMENTUM SURGE (Trade Ideas tarzi)
  momentumSurge?: MomentumSurge;
  
  // SMART MONEY AKTIVITESI
  smartMoney?: SmartMoneyActivity;
}

export interface ScanProgress {
  phase: 'idle' | 'initializing' | 'fetching' | 'analyzing' | 'scoring' | 'ranking' | 'complete';
  currentBatch: number;
  totalBatches: number;
  scannedCount: number;
  totalCount: number;
  percentComplete: number;
  message: string;
  estimatedTimeRemaining?: number;
  currentSymbol?: string;
}

export interface HistoricalDataResponse {
  symbol: string;
  bars: HistoricalBar[];
  currentQuote: {
    price: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    dayHigh: number;
    dayLow: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    name: string;
  };
}

// Sinyal Puan Matrisi - Titizlikle hesaplanmis
export const ELITE_SIGNAL_POINTS = {
  // === MOMENTUM SINYALLERI ===
  // RSI
  RSI_OVERSOLD_BULLISH_DIVERGENCE: { points: 35, weight: 5, reliability: 85 },
  RSI_OVERSOLD_RISING: { points: 25, weight: 4, reliability: 75 },
  RSI_NEUTRAL_RISING: { points: 10, weight: 2, reliability: 60 },
  RSI_OVERBOUGHT: { points: -20, weight: 3, reliability: 70 },
  RSI_OVERBOUGHT_BEARISH_DIVERGENCE: { points: -35, weight: 5, reliability: 85 },
  
  // MACD
  MACD_BULLISH_CROSS_BELOW_ZERO: { points: 30, weight: 5, reliability: 80 },
  MACD_BULLISH_CROSS_ABOVE_ZERO: { points: 20, weight: 3, reliability: 70 },
  MACD_HISTOGRAM_RISING: { points: 15, weight: 2, reliability: 65 },
  MACD_BULLISH_DIVERGENCE: { points: 35, weight: 5, reliability: 85 },
  MACD_BEARISH_CROSS: { points: -25, weight: 4, reliability: 75 },
  MACD_BEARISH_DIVERGENCE: { points: -35, weight: 5, reliability: 85 },
  
  // Stochastic
  STOCH_OVERSOLD_BULLISH_CROSS: { points: 25, weight: 4, reliability: 75 },
  STOCH_OVERBOUGHT_BEARISH_CROSS: { points: -25, weight: 4, reliability: 75 },
  
  // Williams %R
  WILLIAMS_OVERSOLD_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  WILLIAMS_OVERBOUGHT_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  // CCI
  CCI_OVERSOLD_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  CCI_OVERBOUGHT_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  // MFI
  MFI_OVERSOLD: { points: 20, weight: 4, reliability: 75 },
  MFI_OVERBOUGHT: { points: -20, weight: 4, reliability: 75 },
  
  // === TREND SINYALLERI ===
  // EMA Alignment
  EMA_PERFECT_BULLISH_ALIGNMENT: { points: 40, weight: 5, reliability: 90 },
  EMA_BULLISH_ALIGNMENT: { points: 25, weight: 4, reliability: 80 },
  EMA_BEARISH_ALIGNMENT: { points: -25, weight: 4, reliability: 80 },
  EMA_PERFECT_BEARISH_ALIGNMENT: { points: -40, weight: 5, reliability: 90 },
  
  // Price vs EMAs
  PRICE_ABOVE_ALL_EMAS: { points: 30, weight: 4, reliability: 85 },
  PRICE_CROSS_EMA21_UP: { points: 20, weight: 3, reliability: 75 },
  PRICE_CROSS_EMA55_UP: { points: 25, weight: 4, reliability: 80 },
  PRICE_BELOW_ALL_EMAS: { points: -30, weight: 4, reliability: 85 },
  
  // ADX
  ADX_STRONG_BULLISH_TREND: { points: 25, weight: 4, reliability: 80 },
  ADX_WEAK_TREND: { points: 5, weight: 1, reliability: 50 },
  ADX_STRONG_BEARISH_TREND: { points: -25, weight: 4, reliability: 80 },
  
  // Parabolic SAR
  PSAR_BULLISH_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  PSAR_BEARISH_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  // Ichimoku
  ICHIMOKU_STRONG_BUY: { points: 40, weight: 5, reliability: 90 },
  ICHIMOKU_BUY: { points: 25, weight: 4, reliability: 80 },
  ICHIMOKU_SELL: { points: -25, weight: 4, reliability: 80 },
  ICHIMOKU_STRONG_SELL: { points: -40, weight: 5, reliability: 90 },
  
  // === VOLATILITE SINYALLERI ===
  // Bollinger Bands
  BB_SQUEEZE_BREAKOUT_UP: { points: 30, weight: 4, reliability: 80 },
  BB_TOUCH_LOWER_REVERSAL: { points: 25, weight: 4, reliability: 75 },
  BB_TOUCH_UPPER_REVERSAL: { points: -20, weight: 3, reliability: 70 },
  
  // ATR
  ATR_EXPANDING_WITH_TREND: { points: 15, weight: 2, reliability: 65 },
  ATR_CONTRACTING: { points: 10, weight: 2, reliability: 60 },
  
  // === HACIM SINYALLERI ===
  VOLUME_SURGE_WITH_PRICE_UP: { points: 30, weight: 4, reliability: 85 },
  VOLUME_SURGE_WITH_PRICE_DOWN: { points: -25, weight: 4, reliability: 80 },
  VOLUME_CLIMAX_REVERSAL: { points: 20, weight: 3, reliability: 70 },
  LOW_VOLUME_WARNING: { points: -15, weight: 3, reliability: 75 },
  
  // OBV
  OBV_BULLISH_DIVERGENCE: { points: 30, weight: 4, reliability: 80 },
  OBV_BEARISH_DIVERGENCE: { points: -30, weight: 4, reliability: 80 },
  OBV_RISING_TREND: { points: 15, weight: 2, reliability: 65 },
  
  // Chaikin MF
  CMF_STRONG_ACCUMULATION: { points: 25, weight: 4, reliability: 80 },
  CMF_STRONG_DISTRIBUTION: { points: -25, weight: 4, reliability: 80 },
  
  // === MUM FORMASYONLARI ===
  PATTERN_BULLISH_ENGULFING: { points: 25, weight: 4, reliability: 75 },
  PATTERN_MORNING_STAR: { points: 30, weight: 4, reliability: 80 },
  PATTERN_THREE_WHITE_SOLDIERS: { points: 35, weight: 5, reliability: 85 },
  PATTERN_HAMMER: { points: 20, weight: 3, reliability: 70 },
  PATTERN_PIERCING_LINE: { points: 20, weight: 3, reliability: 70 },
  PATTERN_TWEEZER_BOTTOM: { points: 20, weight: 3, reliability: 70 },
  
  PATTERN_BEARISH_ENGULFING: { points: -25, weight: 4, reliability: 75 },
  PATTERN_EVENING_STAR: { points: -30, weight: 4, reliability: 80 },
  PATTERN_THREE_BLACK_CROWS: { points: -35, weight: 5, reliability: 85 },
  PATTERN_DARK_CLOUD_COVER: { points: -20, weight: 3, reliability: 70 },
  
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

// ==========================================
// GELISMIS SABAH YESIL YAKMA ANALIZI - V2
// Dunya Standartlarinda Profesyonel Trader
// ==========================================

export interface ExtendedMorningGreenAnalysis extends MorningGreenAnalysis {
  // Hot Streak Analizi (3+ gun ust uste yesil)
  hotStreak: {
    active: boolean;
    currentStreak: number;
    maxStreakLast30d: number;
    streakStrength: number; // 0-100
    avgStreakGain: number; // Streak suresince ortalama kazanc %
    streakStartDate?: string;
    streakEndPrediction?: {
      probability: number;
      reasoning: string;
    };
  };
  
  // 17:45 Sonrasi Detayli Analiz
  afternoonAnalysis: {
    // Son 20 gunde 17:45 yesil kapanip ertesi sabah ne oldu
    greenCloseToGreenMorning: number; // Kac kez sabah yesil
    greenCloseToRedMorning: number; // Kac kez sabah kirmizi
    greenCloseReliability: number; // % guvenilirlik
    
    // Son 20 gunde 17:45 kirmizi kapanip ertesi sabah ne oldu
    redCloseToGreenMorning: number;
    redCloseToRedMorning: number;
    redCloseReliability: number;
    
    // Gap davranisi
    avgGapAfterGreenClose: number; // Yesil kapanistan sonra ortalama gap
    avgGapAfterRedClose: number;
    
    // Bugunun tahmini (17:45 sonrasi icin)
    todayPrediction: {
      closedGreen: boolean;
      tomorrowExpectedGap: number;
      tomorrowGreenProbability: number;
      confidence: number;
      reasoning: string[];
    };
  };
  
  // Gap Follow-Through Analizi
  gapFollowThrough: {
    // Gap sonrasi fiyat davranisi
    gapUpFollowThroughRate: number; // Gap up sonrasi yukari devam %
    gapDownFollowThroughRate: number; // Gap down sonrasi asagi devam %
    avgGapUpContinuation: number; // Gap up sonrasi ek kazanc %
    avgGapDownContinuation: number;
    
    // Tarihsel gap verileri
    last10Gaps: {
      date: string;
      gapPercent: number;
      followThrough: boolean;
      continuationPercent: number;
    }[];
    
    // Pattern
    gapPattern: 'consistent_follow' | 'gap_and_reverse' | 'gap_fill' | 'mixed';
    patternStrength: number;
  };
  
  // Zaman Bazli Analiz
  timingAnalysis: {
    // En iyi giris zamani
    optimalEntryTime: string; // HH:MM formati
    optimalEntryReasoning: string;
    
    // Saat bazli performans
    hourlyPerformance: {
      hour: string; // "09:30", "10:00", vs.
      avgReturn: number;
      winRate: number;
      sampleSize: number;
    }[];
    
    // Ilk 30 dakika analizi
    first30MinStats: {
      avgMove: number;
      upProbability: number;
      bestScenario: number;
      worstScenario: number;
    };
  };
  
  // Hacim-Fiyat Korelasyonu
  volumePriceCorrelation: {
    morningVolumeToPrice: number; // -1 to 1 korelasyon
    highVolumeGreenMorningRate: number; // Yuksek hacimli gunlerde yesil sabah orani
    lowVolumeGreenMorningRate: number;
    volumePredictsPriceDirection: boolean;
    correlationStrength: 'strong' | 'moderate' | 'weak' | 'none';
  };
  
  // Sektor Karsilastirmasi
  sectorComparison?: {
    sectorAvgMorningGreenScore: number;
    stockVsSector: number; // Hisse skoru - sektor ortalamasi
    sectorRank: number; // Sektordeki sira
    sectorTotalStocks: number;
    betterThanSectorPercent: number;
  };
  
  // AI Tahmin Motoru
  aiPrediction: {
    tomorrowGreenProbability: number; // %
    tomorrowExpectedGap: number; // %
    confidence: number;
    factors: {
      name: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
    }[];
    recommendation: 'STRONG_BUY_MORNING' | 'BUY_MORNING' | 'WAIT' | 'AVOID_MORNING' | 'SHORT_MORNING';
    riskLevel: 'low' | 'medium' | 'high';
  };
}

// Premarket Tahmini
export interface PremarketPrediction {
  symbol: string;
  
  // Gap Tahmini
  predictedGap: {
    percent: number;
    direction: 'up' | 'down' | 'flat';
    confidence: number;
    range: {
      min: number;
      max: number;
    };
  };
  
  // Momentum Tahmini
  momentumForecast: {
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number; // 0-100
    expectedMove: number; // %
    timeHorizon: '30min' | '1hour' | 'morning_session';
  };
  
  // Pattern Eslestirme
  patternMatch: {
    similarDays: number; // Son 60 gunde benzer pattern sayisi
    avgOutcome: number; // Benzer gunlerde ortalama sonuc %
    successRate: number; // % basari orani
    bestCase: number;
    worstCase: number;
    matchedPattern: string; // Pattern ismi
  };
  
  // Hacim Beklentisi
  volumeExpectation: {
    expectedRatio: number; // Ortalamaya gore beklenen hacim
    significance: 'very_high' | 'high' | 'normal' | 'low';
  };
  
  // Risk Skoru
  premarketRisk: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high';
    warnings: string[];
  };
  
  // Strateji Onerisi
  strategy: {
    action: 'PREMARKET_BUY' | 'OPEN_BUY' | 'WAIT_PULLBACK' | 'AVOID';
    entryPrice?: number;
    stopLoss?: number;
    target1?: number;
    target2?: number;
    reasoning: string[];
  };
  
  lastUpdated: Date;
}

// Confluence Skoru (Multi-Signal Hizalama)
export interface ConfluenceScore {
  // Kategori bazinda sinyal sayilari
  categories: {
    momentum: { buy: number; sell: number; neutral: number };
    trend: { buy: number; sell: number; neutral: number };
    volume: { buy: number; sell: number; neutral: number };
    pattern: { buy: number; sell: number; neutral: number };
    supportResistance: { buy: number; sell: number; neutral: number };
    ichimoku: { buy: number; sell: number; neutral: number };
    multiTimeframe: { buy: number; sell: number; neutral: number };
  };
  
  // Confluence Metrikleri
  totalBuySignals: number;
  totalSellSignals: number;
  totalNeutralSignals: number;
  
  // Hizalanmis kategori sayisi (3+ alim sinyali olan kategoriler)
  alignedBuyCategories: number;
  alignedSellCategories: number;
  
  // Perfect Setup (5+ kategori hizalanmis)
  isPerfectSetup: boolean;
  perfectSetupType?: 'BUY' | 'SELL';
  
  // Confluence Skoru
  score: number; // -100 to +100
  strength: 'extreme_buy' | 'strong_buy' | 'moderate_buy' | 'weak' | 'moderate_sell' | 'strong_sell' | 'extreme_sell';
  
  // Guven
  confidence: number; // 0-100
  reliability: number; // Tarihsel basari orani
}

// Hot Streak Hissesi
export interface HotStreakStock {
  symbol: string;
  name: string;
  
  // Streak Bilgisi
  currentStreak: number; // Ust uste kac gun yesil sabah
  streakStartDate: string;
  streakGain: number; // Streak basladigindan beri toplam kazanc %
  avgDailyGain: number; // Streak suresince ortalama gunluk kazanc
  
  // Streak Gucu
  streakStrength: number; // 0-100
  momentumAcceleration: boolean; // Momentum hizlaniyor mu
  volumeConfirmation: boolean; // Hacim dogruluyor mu
  
  // Tahminler
  streakContinueProbability: number; // Streak devam etme olasiligi %
  expectedNextGap: number; // Yarin beklenen gap %
  
  // Risk
  streakExhaustionRisk: number; // Streak yorulmasi riski
  priceOverextended: boolean; // Fiyat cok uzamis mi
  
  // Skor
  hotScore: number; // 0-100 genel sicaklik skoru
  rank: number; // Hot streak siralamasindaki yeri
}

// Backtest Sonucu
export interface BacktestResult {
  // Strateji Bilgisi
  strategyName: string;
  period: string; // "60_days", "90_days", "1_year"
  
  // Sonuclar
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  
  // Kar/Zarar
  totalReturn: number; // %
  avgWinPercent: number;
  avgLossPercent: number;
  profitFactor: number; // Toplam kar / Toplam zarar
  
  // Risk Metrikleri
  maxDrawdown: number; // %
  sharpeRatio: number;
  sortinoRatio: number;
  
  // Trade Istatistikleri
  avgHoldingPeriod: number; // Gun
  bestTrade: { date: string; return: number };
  worstTrade: { date: string; return: number };
  
  // Zaman Analizi
  bestDayOfWeek: string;
  worstDayOfWeek: string;
  bestMonth: string;
  
  // Guven
  statisticalSignificance: number; // % anlamlilik
  sampleSizeAdequate: boolean;
}

// Sabah Tarama Sonucu
export interface MorningScanResult extends EliteScanResult {
  // Gelismis Sabah Analizi
  extendedMorningGreen: ExtendedMorningGreenAnalysis;
  
  // Premarket Tahmini
  premarketPrediction: PremarketPrediction;
  
  // Confluence
  confluence: ConfluenceScore;
  
  // Hot Streak (eger varsa)
  hotStreak?: HotStreakStock;
  
  // Sabah Ozel Skoru
  morningScore: {
    total: number; // 0-100
    breakdown: {
      greenHistory: number; // 30 puan max
      afternoonReliability: number; // 25 puan max
      gapFollowThrough: number; // 20 puan max
      hotStreakBonus: number; // 15 puan max
      confluenceBonus: number; // 10 puan max
    };
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  };
  
  // Sabah Stratejisi
  morningStrategy: {
    action: 'STRONG_MORNING_BUY' | 'MORNING_BUY' | 'WAIT_FOR_DIP' | 'DAY_TRADE_ONLY' | 'AVOID';
    entryTiming: 'PREMARKET' | 'OPEN' | 'FIRST_PULLBACK' | 'BREAKOUT';
    entryPrice?: number;
    stopLoss: number;
    target1: number;
    target2?: number;
    riskReward: number;
    confidence: number;
    reasoning: string[];
  };
}

// Risk Esikleri
export const RISK_THRESHOLDS = {
  MAX_VOLATILITY_ATR_PERCENT: 5, // ATR %5'ten fazlaysa tehlikeli
  MIN_VOLUME_RATIO: 0.5, // Ortalama hacimin %50'sinden az = likidite riski
  MIN_LIQUIDITY_VALUE: 1000000, // Gunluk minimum 1M TL islem
  MAX_SPREAD_PERCENT: 1, // %1'den fazla spread = tehlikeli
  MAX_DAILY_MOVE: 10, // Tek gunde %10'dan fazla hareket = dikkat
  OVERBOUGHT_RSI: 75,
  OVERSOLD_RSI: 25,
} as const;

// Pozisyon Boyutlandirma
export const POSITION_SIZING = {
  MAX_SINGLE_POSITION_PERCENT: 10, // Tek pozisyonda max %10
  MIN_RISK_REWARD_RATIO: 1.5, // Minimum 1:1.5 risk/odul
  MAX_PORTFOLIO_RISK_PERCENT: 2, // Tek islemde max %2 portfolio riski
  KELLY_MULTIPLIER: 0.5, // Kelly formulunun yarisi (daha guvenli)
} as const;
