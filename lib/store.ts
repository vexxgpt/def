"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Position, Alert, WatchlistItem, StockData, AIAnalysis } from "./types";

interface TradingStore {
  // Pozisyonlar
  positions: Position[];
  addPosition: (position: Omit<Position, "id">) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  closePosition: (id: string, sellPrice: number) => void;
  deletePosition: (id: string) => void;

  // Uyarılar
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, "id" | "createdAt" | "isRead">) => void;
  markAlertAsRead: (id: string) => void;
  clearAlerts: () => void;

  // İzleme Listesi
  watchlist: WatchlistItem[];
  addToWatchlist: (symbol: string, notes?: string, targetBuyPrice?: number) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateWatchlistItem: (symbol: string, updates: Partial<WatchlistItem>) => void;

  // Hisse Verileri (cache)
  stockDataCache: Record<string, StockData>;
  updateStockData: (symbol: string, data: StockData) => void;
  clearStockCache: () => void;

  // AI Analizleri
  aiAnalyses: AIAnalysis[];
  addAIAnalysis: (analysis: AIAnalysis) => void;
  clearAIAnalyses: () => void;

  // Ayarlar
  settings: {
    autoRefresh: boolean;
    refreshInterval: number; // saniye
    notifications: boolean;
    darkMode: boolean;
  };
  updateSettings: (updates: Partial<TradingStore["settings"]>) => void;

  // Seçili hisse
  selectedStock: string | null;
  setSelectedStock: (symbol: string | null) => void;

  // Arama
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      // Pozisyonlar
      positions: [],
      addPosition: (position) =>
        set((state) => ({
          positions: [
            ...state.positions,
            { ...position, id: crypto.randomUUID() },
          ],
        })),
      updatePosition: (id, updates) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      closePosition: (id, sellPrice) =>
        set((state) => ({
          positions: state.positions.map((p) => {
            if (p.id === id) {
              const profit = (sellPrice - p.buyPrice) * p.quantity;
              const profitPercent = ((sellPrice - p.buyPrice) / p.buyPrice) * 100;
              return {
                ...p,
                status: "satildi" as const,
                sellPrice,
                sellDate: new Date(),
                profit,
                profitPercent,
              };
            }
            return p;
          }),
        })),
      deletePosition: (id) =>
        set((state) => ({
          positions: state.positions.filter((p) => p.id !== id),
        })),

      // Uyarılar
      alerts: [],
      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              isRead: false,
            },
            ...state.alerts,
          ].slice(0, 100), // Son 100 uyarıyı tut
        })),
      markAlertAsRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isRead: true } : a
          ),
        })),
      clearAlerts: () => set({ alerts: [] }),

      // İzleme Listesi
      watchlist: [],
      addToWatchlist: (symbol, notes, targetBuyPrice) =>
        set((state) => {
          if (state.watchlist.some((w) => w.symbol === symbol)) {
            return state;
          }
          return {
            watchlist: [
              ...state.watchlist,
              { symbol, addedAt: new Date(), notes, targetBuyPrice },
            ],
          };
        }),
      removeFromWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.filter((w) => w.symbol !== symbol),
        })),
      updateWatchlistItem: (symbol, updates) =>
        set((state) => ({
          watchlist: state.watchlist.map((w) =>
            w.symbol === symbol ? { ...w, ...updates } : w
          ),
        })),

      // Hisse Verileri Cache
      stockDataCache: {},
      updateStockData: (symbol, data) =>
        set((state) => ({
          stockDataCache: { ...state.stockDataCache, [symbol]: data },
        })),
      clearStockCache: () => set({ stockDataCache: {} }),

      // AI Analizleri
      aiAnalyses: [],
      addAIAnalysis: (analysis) =>
        set((state) => ({
          aiAnalyses: [analysis, ...state.aiAnalyses].slice(0, 50),
        })),
      clearAIAnalyses: () => set({ aiAnalyses: [] }),

      // Ayarlar
      settings: {
        autoRefresh: true,
        refreshInterval: 60,
        notifications: true,
        darkMode: false,
      },
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      // Seçili hisse
      selectedStock: null,
      setSelectedStock: (symbol) => set({ selectedStock: symbol }),

      // Arama
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: "bist-trading-store",
      partialize: (state) => ({
        positions: state.positions,
        alerts: state.alerts,
        watchlist: state.watchlist,
        aiAnalyses: state.aiAnalyses,
        settings: state.settings,
      }),
    }
  )
);
