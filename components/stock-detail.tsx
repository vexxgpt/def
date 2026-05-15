"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Brain,
  RefreshCw,
  Star,
  StarOff,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTradingStore } from "@/lib/store";
import { findSector } from "@/lib/bist-stocks";
import type { StockData } from "@/lib/types";

export function StockDetail() {
  const {
    selectedStock,
    setSelectedStock,
    stockDataCache,
    updateStockData,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    addPosition,
    addAlert,
    addAIAnalysis,
    aiAnalyses,
  } = useTradingStore();

  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [newPosition, setNewPosition] = useState({ quantity: "", buyPrice: "" });

  const fetchStockData = useCallback(async () => {
    if (!selectedStock) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/stocks?symbols=${selectedStock}`);
      const data = await res.json();
      if (data.data && data.data[0]) {
        setStockData(data.data[0]);
        updateStockData(selectedStock, data.data[0]);
      }
    } catch (error) {
      console.error("Hisse detayı alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedStock, updateStockData]);

  useEffect(() => {
    if (selectedStock) {
      // Önce cache'e bak
      const cached = stockDataCache[selectedStock];
      if (cached) {
        setStockData(cached);
      }
      fetchStockData();

      // Önceki AI analizlerini bul
      const prevAnalysis = aiAnalyses.find((a) => a.symbol === selectedStock);
      if (prevAnalysis) {
        setAiResult({
          recommendation: prevAnalysis.recommendation,
          confidence: prevAnalysis.confidence,
          reasoning: prevAnalysis.reasoning,
        });
      } else {
        setAiResult(null);
      }
    }
  }, [selectedStock, stockDataCache, aiAnalyses, fetchStockData]);

  const analyzeWithAI = async () => {
    if (!selectedStock || !stockData) return;

    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: selectedStock,
          stockData,
          action: "analyze",
        }),
      });
      const data = await res.json();

      if (data.success && data.analysis) {
        setAiResult(data.analysis);
        addAIAnalysis({
          symbol: selectedStock,
          recommendation: data.analysis.recommendation || "bekle",
          confidence: data.analysis.confidence || 50,
          reasoning: data.analysis.reasoning || data.rawResponse,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error("AI analizi yapılamadı:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddPosition = () => {
    if (!selectedStock || !newPosition.quantity || !newPosition.buyPrice) return;

    const buyPrice =
      parseFloat(newPosition.buyPrice) || stockData?.price || 0;
    const quantity = parseInt(newPosition.quantity);
    const targetPrice = buyPrice * 1.01;

    addPosition({
      symbol: selectedStock,
      buyPrice,
      buyDate: new Date(),
      quantity,
      targetPrice,
      status: "acik",
    });

    addAlert({
      symbol: selectedStock,
      type: "bilgi",
      message: `Yeni pozisyon açıldı: ${quantity} adet x ${buyPrice.toFixed(2)} ₺`,
    });

    setNewPosition({ quantity: "", buyPrice: "" });
    setIsAddPositionOpen(false);
  };

  const isInWatchlist = watchlist.some((w) => w.symbol === selectedStock);

  if (!selectedStock) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Detay görmek için bir hisse seçin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {selectedStock}
              <Badge variant="outline">{findSector(selectedStock)}</Badge>
            </CardTitle>
            {stockData && (
              <p className="text-sm text-muted-foreground mt-1">{stockData.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (isInWatchlist) {
                  removeFromWatchlist(selectedStock);
                } else {
                  addToWatchlist(selectedStock);
                }
              }}
            >
              {isInWatchlist ? (
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={fetchStockData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedStock(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading && !stockData ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stockData ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="ai">AI Analiz</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Fiyat Bilgisi */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {stockData.price.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ₺
                  </p>
                  <div
                    className={`flex items-center gap-1 text-lg font-medium ${
                      stockData.changePercent >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {stockData.changePercent >= 0 ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    {stockData.changePercent >= 0 ? "+" : ""}
                    {stockData.change.toFixed(2)} ₺ (
                    {stockData.changePercent.toFixed(2)}%)
                  </div>
                </div>
                <Button onClick={() => setIsAddPositionOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Pozisyon Aç
                </Button>
              </div>

              {/* Detay Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Önceki Kapanış</p>
                  <p className="font-semibold">{stockData.previousClose.toFixed(2)} ₺</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Hacim</p>
                  <p className="font-semibold">
                    {(stockData.volume / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Günün En Düşüğü</p>
                  <p className="font-semibold text-red-600">
                    {stockData.dayLow.toFixed(2)} ₺
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Günün En Yükseği</p>
                  <p className="font-semibold text-emerald-600">
                    {stockData.dayHigh.toFixed(2)} ₺
                  </p>
                </div>
                {stockData.fiftyTwoWeekLow && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">52 Hafta En Düşük</p>
                    <p className="font-semibold">{stockData.fiftyTwoWeekLow.toFixed(2)} ₺</p>
                  </div>
                )}
                {stockData.fiftyTwoWeekHigh && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">52 Hafta En Yüksek</p>
                    <p className="font-semibold">{stockData.fiftyTwoWeekHigh.toFixed(2)} ₺</p>
                  </div>
                )}
              </div>

              {/* Hedef Fiyat Hesaplayıcı */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm font-medium mb-2">%1 Hedef Fiyat</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-emerald-600">
                    {(stockData.price * 1.01).toFixed(2)} ₺
                  </p>
                  <Badge className="bg-emerald-500">
                    +{(stockData.price * 0.01).toFixed(2)} ₺
                  </Badge>
                </div>
              </div>

              {/* Dış Link */}
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`https://finance.yahoo.com/quote/${selectedStock}.IS`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Yahoo Finance&apos;ta Görüntüle
                </a>
              </Button>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <Button
                onClick={analyzeWithAI}
                disabled={analyzing}
                className="w-full"
                variant={aiResult ? "outline" : "default"}
              >
                <Brain className={`h-4 w-4 mr-2 ${analyzing ? "animate-pulse" : ""}`} />
                {analyzing
                  ? "Analiz Ediliyor..."
                  : aiResult
                  ? "Yeniden Analiz Et"
                  : "AI ile Analiz Et"}
              </Button>

              {aiResult && (
                <div className="space-y-4">
                  {/* Öneri */}
                  <div
                    className={`p-4 rounded-lg border ${
                      aiResult.recommendation === "al"
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : aiResult.recommendation === "sat"
                        ? "bg-red-500/10 border-red-500/20"
                        : aiResult.recommendation === "tut"
                        ? "bg-blue-500/10 border-blue-500/20"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Öneri</span>
                      <Badge
                        className={
                          aiResult.recommendation === "al"
                            ? "bg-emerald-500"
                            : aiResult.recommendation === "sat"
                            ? "bg-red-500"
                            : aiResult.recommendation === "tut"
                            ? "bg-blue-500"
                            : ""
                        }
                      >
                        {aiResult.recommendation?.toUpperCase() || "BEKLE"}
                      </Badge>
                    </div>
                    {aiResult.confidence && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Güven:</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${aiResult.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{aiResult.confidence}%</span>
                      </div>
                    )}
                  </div>

                  {/* Açıklama */}
                  {aiResult.reasoning && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Analiz</p>
                      <p className="text-sm text-muted-foreground">{aiResult.reasoning}</p>
                    </div>
                  )}

                  {/* Risk ve Görünüm */}
                  <div className="grid grid-cols-2 gap-3">
                    {aiResult.riskLevel && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Risk Seviyesi</p>
                        <Badge
                          variant="outline"
                          className={
                            aiResult.riskLevel === "düşük"
                              ? "border-emerald-500 text-emerald-600"
                              : aiResult.riskLevel === "yüksek"
                              ? "border-red-500 text-red-600"
                              : "border-orange-500 text-orange-600"
                          }
                        >
                          {aiResult.riskLevel}
                        </Badge>
                      </div>
                    )}
                    {aiResult.shortTermOutlook && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Kısa Vade</p>
                        <Badge
                          variant="outline"
                          className={
                            aiResult.shortTermOutlook === "pozitif"
                              ? "border-emerald-500 text-emerald-600"
                              : aiResult.shortTermOutlook === "negatif"
                              ? "border-red-500 text-red-600"
                              : "border-muted-foreground"
                          }
                        >
                          {aiResult.shortTermOutlook}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Bu analiz yatırım tavsiyesi değildir
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Veri yüklenemedi</p>
          </div>
        )}
      </CardContent>

      {/* Pozisyon Ekleme Dialog */}
      <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pozisyon Aç - {selectedStock}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Adet</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Örn: 100"
                value={newPosition.quantity}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Alış Fiyatı (₺)</Label>
              <Input
                id="buyPrice"
                type="number"
                step="0.01"
                placeholder={stockData?.price.toFixed(2) || "0.00"}
                value={newPosition.buyPrice}
                onChange={(e) =>
                  setNewPosition({ ...newPosition, buyPrice: e.target.value })
                }
              />
              {stockData && (
                <p className="text-xs text-muted-foreground">
                  Güncel fiyat: {stockData.price.toFixed(2)} ₺
                </p>
              )}
            </div>
            {newPosition.buyPrice && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Hedef Fiyat (%1):{" "}
                  <span className="font-semibold text-emerald-600">
                    {(parseFloat(newPosition.buyPrice) * 1.01).toFixed(2)} ₺
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPositionOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleAddPosition}>Pozisyon Aç</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
