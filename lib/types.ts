// Tip Tanımlamaları

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  lastUpdated: Date;
}

export interface Position {
  id: string;
  symbol: string;
  buyPrice: number;
  buyDate: Date;
  quantity: number;
  targetPrice: number; // %1 hedef fiyat
  status: "acik" | "satildi" | "beklemede";
  sellPrice?: number;
  sellDate?: Date;
  profit?: number;
  profitPercent?: number;
}

export interface Alert {
  id: string;
  symbol: string;
  type: "hedef_ulasildi" | "alim_sinyali" | "satim_sinyali" | "bilgi" | "basari" | "hata";
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export interface TradingStrategy {
  buyTime: string; // "17:30" - Kapanıştan 15dk önce
  sellCondition: {
    minGainPercent: number; // %1
    startTime: string; // "10:00"
  };
}

export interface MarketStatus {
  isOpen: boolean;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
  message: string;
}

export interface AIAnalysis {
  symbol: string;
  recommendation: "al" | "sat" | "tut" | "bekle";
  confidence: number;
  reasoning: string;
  technicalIndicators?: {
    rsi?: number;
    macd?: string;
    trend?: string;
  };
  createdAt: Date;
}

export interface DailyStats {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalProfit: number;
  winRate: number;
  bestPerformer?: {
    symbol: string;
    profit: number;
  };
  worstPerformer?: {
    symbol: string;
    profit: number;
  };
}

export interface WatchlistItem {
  symbol: string;
  addedAt: Date;
  notes?: string;
  targetBuyPrice?: number;
}
