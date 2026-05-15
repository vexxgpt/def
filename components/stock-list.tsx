"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  Brain,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Rocket,
  Zap,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BIST_STOCKS, STOCK_SECTORS, findSector, POPULAR_STOCKS, TOTAL_STOCK_COUNT } from "@/lib/bist-stocks";
import { useTradingStore } from "@/lib/store";
import type { StockData } from "@/lib/types";

const BATCH_SIZE = 15;

type SortField = "symbol" | "price" | "changePercent" | "volume";
type SortDirection = "asc" | "desc";

export function StockList() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("changePercent");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState(50);
  const [analyzingStock, setAnalyzingStock] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState(false);

  const {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    setSelectedStock,
    updateStockData,
    addAlert,
    addAIAnalysis,
  } = useTradingStore();

  const fetchStocks = useCallback(async (symbols: string[], showLoading = true) => {
    if (symbols.length === 0) return [];

    if (showLoading) setLoading(true);
    try {
      const batches = [];
      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        batches.push(symbols.slice(i, i + BATCH_SIZE));
      }

      const allStocks: StockData[] = [];

      for (const batch of batches) {
        try {
          const res = await fetch(`/api/stocks?symbols=${batch.join(",")}`);
          const data = await res.json();
          if (data.data) {
            allStocks.push(...data.data);
            data.data.forEach((stock: StockData) => {
              updateStockData(stock.symbol, stock);
            });
          }
        } catch (err) {
          console.error("Batch fetch hatasi:", err);
        }
      }

      return allStocks;
    } catch (error) {
      console.error("Hisseler yuklenemedi:", error);
      return [];
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [updateStockData]);

  // Tam tarama fonksiyonu - 610 hisse
  const startFullScan = useCallback(async () => {
    setScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    
    const allSymbols = [...BIST_STOCKS];
    const batchCount = Math.ceil(allSymbols.length / BATCH_SIZE);
    const allStocks: StockData[] = [];

    addAlert({
      symbol: "SISTEM",
      type: "bilgi",
      message: `${TOTAL_STOCK_COUNT} hisse taramasi basladi...`,
    });

    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      const batch = allSymbols.slice(i, i + BATCH_SIZE);
      
      try {
        const res = await fetch(`/api/stocks?symbols=${batch.join(",")}`);
        const data = await res.json();
        
        if (data.data) {
          allStocks.push(...data.data);
          data.data.forEach((stock: StockData) => {
            updateStockData(stock.symbol, stock);
          });
        }
      } catch (err) {
        console.error("Batch tarama hatasi:", err);
      }

      const progress = Math.round(((i + batch.length) / allSymbols.length) * 100);
      setScanProgress(progress);
      
      // API rate limit icin kisa bekleme
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setStocks(allStocks);
    setScanning(false);
    setScanComplete(true);

    addAlert({
      symbol: "SISTEM",
      type: "basari",
      message: `Tarama tamamlandi! ${allStocks.length} hisse yuklendi.`,
    });
  }, [updateStockData, addAlert]);

  // Ilk yuklemede populer hisseleri getir
  useEffect(() => {
    const loadPopular = async () => {
      const popularData = await fetchStocks(POPULAR_STOCKS);
      setStocks(popularData);
    };
    loadPopular();
  }, [fetchStocks]);

  const analyzeStock = async (symbol: string, stockData?: StockData) => {
    setAnalyzingStock(symbol);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, stockData, action: "analyze" }),
      });
      const data = await res.json();

      if (data.success && data.analysis) {
        addAIAnalysis({
          symbol,
          recommendation: data.analysis.recommendation || "bekle",
          confidence: data.analysis.confidence || 50,
          reasoning: data.analysis.reasoning || data.rawResponse,
          createdAt: new Date(),
        });

        addAlert({
          symbol,
          type: "bilgi",
          message: `AI Analizi: ${data.analysis.reasoning?.substring(0, 100) || data.rawResponse?.substring(0, 100)}...`,
        });
      }
    } catch (error) {
      console.error("AI analizi yapilamadi:", error);
    } finally {
      setAnalyzingStock(null);
    }
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some((w) => w.symbol === symbol);
  };

  const toggleWatchlist = (symbol: string) => {
    if (isInWatchlist(symbol)) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol);
      addAlert({
        symbol,
        type: "bilgi",
        message: `${symbol} izleme listesine eklendi`,
      });
    }
  };

  // En cok yukselenler (Top 5)
  const top5Gainers = useMemo(() => {
    return [...stocks]
      .filter(s => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  }, [stocks]);

  // Filtreleme ve siralama
  const filteredAndSortedStocks = useMemo(() => {
    let filtered = stocks;

    if (searchQuery) {
      const query = searchQuery.toUpperCase();
      filtered = filtered.filter(
        (stock) =>
          stock.symbol.includes(query) ||
          stock.name?.toUpperCase().includes(query)
      );
    }

    if (selectedSector !== "all") {
      const sectorStocks = STOCK_SECTORS[selectedSector] || [];
      filtered = filtered.filter((stock) => sectorStocks.includes(stock.symbol));
    }

    const sorted = [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "symbol":
          aVal = a.symbol;
          bVal = b.symbol;
          break;
        case "price":
          aVal = a.price;
          bVal = b.price;
          break;
        case "changePercent":
          aVal = a.changePercent;
          bVal = b.changePercent;
          break;
        case "volume":
          aVal = a.volume;
          bVal = b.volume;
          break;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return sorted.slice(0, displayCount);
  }, [stocks, searchQuery, selectedSector, sortField, sortDirection, displayCount]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* En Iyi 5 Hisse */}
      {top5Gainers.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              En Iyi 5 Hisse (Gunluk Yukselis)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {top5Gainers.map((stock, index) => (
                <div
                  key={stock.symbol}
                  className="bg-card rounded-lg p-3 border border-border cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedStock(stock.symbol)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-primary">#{index + 1}</span>
                    <span className="font-semibold text-foreground">{stock.symbol}</span>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {stock.price.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL
                  </div>
                  <div className="flex items-center gap-1 text-primary font-medium">
                    <TrendingUp className="h-4 w-4" />
                    +{stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ana Hisse Listesi */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              BIST Hisseleri
              <Badge variant="outline" className="border-border text-muted-foreground">{stocks.length} / {TOTAL_STOCK_COUNT}</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const data = await fetchStocks(POPULAR_STOCKS);
                  setStocks(data);
                }}
                disabled={loading || scanning}
                className="border-border"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </Button>
              
              <Button
                size="sm"
                onClick={startFullScan}
                disabled={loading || scanning}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Rocket className={`h-4 w-4 mr-2 ${scanning ? "animate-bounce" : ""}`} />
                {scanning ? "Taraniyor..." : "Taramayi Baslat"}
              </Button>
            </div>
          </div>

          {/* Tarama Progress Bar */}
          {scanning && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary animate-pulse" />
                  {TOTAL_STOCK_COUNT} hisse taraniyor...
                </span>
                <span className="font-medium text-primary">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2 bg-muted" />
            </div>
          )}

          {scanComplete && !scanning && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Tarama tamamlandi! {stocks.length} hisse yuklendi.
              </p>
            </div>
          )}

          {/* Filtreler */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hisse ara (orn: THYAO, GARAN)..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sektor Sec" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tum Sektorler</SelectItem>
                {Object.keys(STOCK_SECTORS).map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort("symbol")}
                  >
                    Sembol <SortIcon field="symbol" />
                  </TableHead>
                  <TableHead>Sektor</TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:text-primary"
                    onClick={() => handleSort("price")}
                  >
                    Fiyat <SortIcon field="price" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:text-primary"
                    onClick={() => handleSort("changePercent")}
                  >
                    Degisim <SortIcon field="changePercent" />
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:text-primary"
                    onClick={() => handleSort("volume")}
                  >
                    Hacim <SortIcon field="volume" />
                  </TableHead>
                  <TableHead className="text-right">Islemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loading || scanning) && stocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Veriler yukleniyor...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredAndSortedStocks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Sonuc bulunamadi
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedStocks.map((stock) => (
                    <TableRow
                      key={stock.symbol}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedStock(stock.symbol)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(stock.symbol);
                          }}
                        >
                          {isInWatchlist(stock.symbol) ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-semibold">{stock.symbol}</span>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {stock.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {findSector(stock.symbol)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {stock.price.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TL
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium ${
                            stock.changePercent >= 0
                              ? "text-primary"
                              : "text-destructive"
                          }`}
                        >
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          {stock.changePercent >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {(stock.volume / 1000000).toFixed(2)}M
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStock(stock.symbol);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              analyzeStock(stock.symbol, stock);
                            }}
                            disabled={analyzingStock === stock.symbol}
                          >
                            <Brain
                              className={`h-4 w-4 ${
                                analyzingStock === stock.symbol ? "animate-pulse" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredAndSortedStocks.length >= displayCount && stocks.length > displayCount && (
            <div className="p-4 text-center border-t">
              <Button
                variant="outline"
                onClick={() => setDisplayCount((prev) => prev + 50)}
              >
                Daha Fazla Goster ({stocks.length - displayCount} hisse kaldi)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
