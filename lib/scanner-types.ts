// Pro Scanner Type Definitions

export interface HistoricalBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  rsiPrev: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    histogramPrev: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number; // 0-100, position within bands
  };
  ema: {
    ema9: number;
    ema21: number;
    ema50: number;
  };
  sma20: number;
  atr: number;
  volumeSMA20: number;
  stochastic: {
    k: number;
    d: number;
    kPrev: number;
  };
  adx: number;
  obv: number;
  obvTrend: 'rising' | 'falling' | 'neutral';
  priceChange3Days: number;
  avgDailyMove5Days: number;
}

export interface Signal {
  type: 'buy' | 'sell' | 'neutral';
  category: 'rsi' | 'macd' | 'bollinger' | 'ema' | 'volume' | 'trend' | 'stochastic' | 'adx' | 'obv' | 'price';
  name: string;
  description: string;
  points: number;
}

export interface ScanResult {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  
  indicators: TechnicalIndicators;
  signals: Signal[];
  
  score: {
    totalPoints: number;
    maxPossiblePoints: number;
    confidencePercent: number;
    buySignalCount: number;
    sellSignalCount: number;
    confluenceBonus: number;
  };
  
  target: {
    targetPrice: number;
    expectedGainPercent: number;
    stopLoss: number;
    stopLossPercent: number;
    riskRewardRatio: number;
  };
  
  risk: {
    score: number; // 1-10
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  
  lastUpdated: Date;
}

export interface ScanProgress {
  phase: 'idle' | 'fetching' | 'analyzing' | 'scoring' | 'complete';
  currentBatch: number;
  totalBatches: number;
  scannedCount: number;
  totalCount: number;
  percentComplete: number;
  message: string;
}

export interface HistoricalDataResponse {
  symbol: string;
  bars: HistoricalBar[];
  currentQuote: {
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    volume: number;
    dayHigh: number;
    dayLow: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    name: string;
  };
}

// Signal point values
export const SIGNAL_POINTS = {
  // Buy Signals (Positive)
  RSI_OVERSOLD_RISING: 25,
  RSI_LOW_RISING: 15,
  MACD_HISTOGRAM_POSITIVE: 20,
  MACD_BULLISH_CROSS: 25,
  PRICE_NEAR_LOWER_BB: 20,
  PRICE_CROSS_EMA9_UP: 15,
  PRICE_ABOVE_EMA21: 10,
  VOLUME_HIGH_1_5X: 15,
  VOLUME_HIGH_2X: 25,
  THREE_DAY_UPTREND: 10,
  STOCHASTIC_OVERSOLD_RISING: 15,
  ADX_STRONG_TREND: 10,
  OBV_RISING: 10,
  PRICE_APPROACHING_SMA50: 10,
  
  // Sell Signals (Negative)
  RSI_OVERBOUGHT: -20,
  RSI_EXTREME_OVERBOUGHT: -30,
  MACD_HISTOGRAM_NEGATIVE: -15,
  PRICE_ABOVE_UPPER_BB: -15,
  VOLUME_LOW: -10,
  THREE_DAY_DOWNTREND: -15,
  PRICE_BELOW_EMA50_FALLING: -10,
  
  // Bonuses
  CONFLUENCE_2_SIGNALS: 20,
  CONFLUENCE_3_PLUS: 30,
  NEAR_52_WEEK_LOW: 15,
  MODERATE_DAILY_GAIN: 10,
  DIP_BUYING_OPPORTUNITY: 15,
} as const;

// Maximum possible score calculation
export const MAX_BUY_POINTS = 
  SIGNAL_POINTS.RSI_OVERSOLD_RISING +
  SIGNAL_POINTS.MACD_BULLISH_CROSS +
  SIGNAL_POINTS.PRICE_NEAR_LOWER_BB +
  SIGNAL_POINTS.PRICE_CROSS_EMA9_UP +
  SIGNAL_POINTS.PRICE_ABOVE_EMA21 +
  SIGNAL_POINTS.VOLUME_HIGH_2X +
  SIGNAL_POINTS.THREE_DAY_UPTREND +
  SIGNAL_POINTS.STOCHASTIC_OVERSOLD_RISING +
  SIGNAL_POINTS.ADX_STRONG_TREND +
  SIGNAL_POINTS.OBV_RISING +
  SIGNAL_POINTS.PRICE_APPROACHING_SMA50 +
  SIGNAL_POINTS.CONFLUENCE_3_PLUS +
  SIGNAL_POINTS.NEAR_52_WEEK_LOW +
  SIGNAL_POINTS.DIP_BUYING_OPPORTUNITY;
