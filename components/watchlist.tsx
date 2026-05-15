"use client";

import { Star, Trash2, TrendingUp, TrendingDown, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTradingStore } from "@/lib/store";
import { useState, useEffect, useCallback } from "react";
import type { StockData } from "@/lib/types";

export function Watchlist() {
  const {
    watchlist,
    removeFromWatchlist,
    stockDataCache,
    setSelectedStock,
    updateStockData,
  } = useTradingStore();
  const [loading, setLoading] = useState(false);

  const fetchWatchlistData = useCallback(async () => {
    if (watchlist.length === 0) return;

    setLoading(true);
    try {
      const symbols = watchlist.map((w) => w.symbol).join(",");
      const res = await fetch(`/api/stocks?symbols=${symbols}`);
      const data = await res.json();

      if (data.data) {
        data.data.forEach((stock: StockData) => {
          updateStockData(stock.symbol, stock);
        });
      }
    } catch (error) {
      console.error("Izleme listesi verileri alinamadi:", error);
    } finally {
      setLoading(false);
    }
  }, [watchlist, updateStockData]);

  useEffect(() => {
    fetchWatchlistData();
    const interval = setInterval(fetchWatchlistData, 60000);
    return () => clearInterval(interval);
  }, [fetchWatchlistData]);

  if (watchlist.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Star className="h-5 w-5 text-chart-4" />
            Izleme Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Izleme listesi bos</p>
            <p className="text-sm">Hisse listesinden yildiz simgesine tiklayarak ekleyin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Star className="h-5 w-5 text-chart-4 fill-chart-4" />
            Izleme Listesi
            <Badge variant="outline" className="border-border text-muted-foreground">{watchlist.length} hisse</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchWatchlistData}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {watchlist.map((item) => {
          const stockData = stockDataCache[item.symbol];
          return (
            <div
              key={item.symbol}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedStock(item.symbol)}
            >
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-chart-4 fill-chart-4" />
                <div>
                  <span className="font-semibold text-foreground">{item.symbol}</span>
                  {stockData && (
                    <p className="text-sm text-muted-foreground">
                      {stockData.price.toFixed(2)} TL
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {stockData && (
                  <div
                    className={`flex items-center gap-1 text-sm font-medium ${
                      stockData.changePercent >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {stockData.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {stockData.changePercent >= 0 ? "+" : ""}
                    {stockData.changePercent.toFixed(2)}%
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStock(item.symbol);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(item.symbol);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
