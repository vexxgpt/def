"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Sparkles,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BIST_STOCKS, TOTAL_STOCK_COUNT } from "@/lib/bist-stocks";
import { useTradingStore } from "@/lib/store";
import { calculateAllIndicators } from "@/lib/technical-indicators";
import { generateScanResult, sortScanResults, filterQualityResults } from "@/lib/scoring-engine";
import type { ScanResult, ScanProgress, HistoricalDataResponse } from "@/lib/scanner-types";

const BATCH_SIZE = 10;

export function ProScanner() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress>({
    phase: 'idle',
    currentBatch: 0,
    totalBatches: 0,
    scannedCount: 0,
    totalCount: TOTAL_STOCK_COUNT,
    percentComplete: 0,
    message: '',
  });
  const [topResults, setTopResults] = useState<ScanResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [expandedSignals, setExpandedSignals] = useState(true);
  const [scanComplete, setScanComplete] = useState(false);

  const { addAlert } = useTradingStore();

  const startProScan = useCallback(async () => {
    setScanning(true);
    setScanComplete(false);
    setTopResults([]);
    setSelectedResult(null);

    const allSymbols = [...BIST_STOCKS];
    const totalBatches = Math.ceil(allSymbols.length / BATCH_SIZE);
    const allResults: ScanResult[] = [];

    addAlert({
      symbol: "PRO-TARAYICI",
      type: "bilgi",
      message: `Profesyonel tarama baslatildi: ${TOTAL_STOCK_COUNT} hisse, gercek teknik analiz`,
    });

    setProgress({
      phase: 'fetching',
      currentBatch: 0,
      totalBatches,
      scannedCount: 0,
      totalCount: allSymbols.length,
      percentComplete: 0,
      message: 'Tarihsel veriler aliniyor...',
    });

    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      const batch = allSymbols.slice(i, i + BATCH_SIZE);
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

      setProgress(prev => ({
        ...prev,
        phase: 'fetching',
        currentBatch,
        message: `Batch ${currentBatch}/${totalBatches} - Veri aliniyor...`,
      }));

      try {
        const res = await fetch('/api/stocks/historical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: batch, days: 30 }),
        });

        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
          setProgress(prev => ({
            ...prev,
            phase: 'analyzing',
            message: `Batch ${currentBatch}/${totalBatches} - Teknik analiz yapiliyor...`,
          }));

          for (const stockData of data.data as HistoricalDataResponse[]) {
            if (stockData.bars && stockData.bars.length >= 20) {
              try {
                // Calculate real technical indicators
                const indicators = calculateAllIndicators(stockData.bars);

                // Generate complete scan result with scoring
                const result = generateScanResult({
                  symbol: stockData.symbol,
                  name: stockData.currentQuote.name,
                  currentPrice: stockData.currentQuote.price,
                  previousClose: stockData.currentQuote.previousClose,
                  dayChange: stockData.currentQuote.change,
                  dayChangePercent: stockData.currentQuote.changePercent,
                  volume: stockData.currentQuote.volume,
                  dayHigh: stockData.currentQuote.dayHigh,
                  dayLow: stockData.currentQuote.dayLow,
                  fiftyTwoWeekHigh: stockData.currentQuote.fiftyTwoWeekHigh,
                  fiftyTwoWeekLow: stockData.currentQuote.fiftyTwoWeekLow,
                  indicators,
                  currentVolume: stockData.currentQuote.volume,
                });

                allResults.push(result);
              } catch (calcError) {
                console.error(`Hesaplama hatasi (${stockData.symbol}):`, calcError);
              }
            }
          }
        }
      } catch (error) {
        console.error("Batch hatasi:", error);
      }

      const scannedCount = Math.min(i + BATCH_SIZE, allSymbols.length);
      const percentComplete = Math.round((scannedCount / allSymbols.length) * 100);

      setProgress(prev => ({
        ...prev,
        scannedCount,
        percentComplete,
      }));

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Final scoring phase
    setProgress(prev => ({
      ...prev,
      phase: 'scoring',
      percentComplete: 95,
      message: 'Final puanlama ve siralama...',
    }));

    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter and sort results
    const qualityResults = filterQualityResults(allResults);
    const sortedResults = sortScanResults(qualityResults);
    const top5 = sortedResults.slice(0, 5);

    setProgress({
      phase: 'complete',
      currentBatch: totalBatches,
      totalBatches,
      scannedCount: allSymbols.length,
      totalCount: allSymbols.length,
      percentComplete: 100,
      message: 'Tarama tamamlandi!',
    });

    setTopResults(top5);
    setScanComplete(true);
    setScanning(false);

    if (top5.length > 0) {
      setSelectedResult(top5[0]);
    }

    addAlert({
      symbol: "PRO-TARAYICI",
      type: "basari",
      message: `Tarama tamamlandi! ${allResults.length} hisse analiz edildi, ${qualityResults.length} kaliteli firsat, en iyi 5 secildi.`,
    });
  }, [addAlert]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "text-primary";
    if (confidence >= 60) return "text-chart-4";
    return "text-muted-foreground";
  };

  const getRiskColor = (level: string) => {
    if (level === 'low') return "bg-primary/20 text-primary border-primary/30";
    if (level === 'high') return "bg-destructive/20 text-destructive border-destructive/30";
    return "bg-chart-4/20 text-chart-4 border-chart-4/30";
  };

  const getSignalBadgeStyle = (type: 'buy' | 'sell' | 'neutral') => {
    if (type === 'buy') return "bg-primary/20 text-primary border-primary/30";
    if (type === 'sell') return "bg-destructive/20 text-destructive border-destructive/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Scanner Header */}
        <Card className="border-primary/30 glow-green-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/20 glow-green-sm">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground flex items-center gap-2">
                    Pro Hisse Tarayici
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      GERCEK TEKNIK ANALIZ
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {TOTAL_STOCK_COUNT} hisse - RSI, MACD, Bollinger, EMA, Stochastic, ADX, OBV
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>17:45 Tarama Saati</span>
                </div>
                <Button
                  size="lg"
                  onClick={startProScan}
                  disabled={scanning}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-green"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Taraniyor...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Pro Taramayi Baslat
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Section */}
            {scanning && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary animate-pulse" />
                    {progress.message}
                  </span>
                  <span className="font-mono font-medium text-primary">
                    {progress.scannedCount} / {progress.totalCount}
                  </span>
                </div>
                <Progress value={progress.percentComplete} className="h-2 bg-muted" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Faz: {progress.phase === 'fetching' ? 'Veri Toplama' : progress.phase === 'analyzing' ? 'Analiz' : progress.phase === 'scoring' ? 'Puanlama' : 'Tamamlandi'}</span>
                  <span>{progress.percentComplete}%</span>
                </div>
              </div>
            )}

            {/* Scan Complete Badge */}
            {scanComplete && !scanning && (
              <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/30 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Pro Tarama Tamamlandi</p>
                  <p className="text-sm text-muted-foreground">
                    {progress.scannedCount} hisse gercek teknik analiz ile tarand. En yuksek puanli 5 hisse listelendi.
                  </p>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Results Grid */}
        {topResults.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Top 5 List */}
            <div className="xl:col-span-1 space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                En Iyi 5 Firsat
              </h3>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 pr-4">
                  {topResults.map((stock, index) => (
                    <Card
                      key={stock.symbol}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedResult?.symbol === stock.symbol
                          ? "border-primary bg-primary/5 glow-green-sm"
                          : "border-border"
                      }`}
                      onClick={() => setSelectedResult(stock)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary font-bold text-lg shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">{stock.symbol}</span>
                              <Badge variant="outline" className={`text-xs ${getConfidenceColor(stock.score.confidencePercent)}`}>
                                {stock.score.confidencePercent}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{stock.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-medium text-foreground">
                                {stock.currentPrice.toFixed(2)} TL
                              </span>
                              <span className={`text-xs flex items-center gap-1 ${
                                stock.dayChangePercent >= 0 ? "text-primary" : "text-destructive"
                              }`}>
                                {stock.dayChangePercent >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {stock.dayChangePercent >= 0 ? "+" : ""}{stock.dayChangePercent.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {stock.score.buySignalCount} AL
                              </Badge>
                              {stock.score.sellSignalCount > 0 && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0 border-destructive/30 text-destructive">
                                  {stock.score.sellSignalCount} SAT
                                </Badge>
                              )}
                              <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getRiskColor(stock.risk.level)}`}>
                                Risk: {stock.risk.score}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Detailed Analysis */}
            {selectedResult && (
              <div className="xl:col-span-2">
                <Card className="border-primary/30">
                  <CardHeader className="border-b border-border pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-2xl text-foreground">{selectedResult.symbol}</CardTitle>
                          <Badge variant="outline" className="text-muted-foreground">
                            {selectedResult.sector}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{selectedResult.name}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getConfidenceColor(selectedResult.score.confidencePercent)}`}>
                          {selectedResult.score.confidencePercent}%
                        </div>
                        <p className="text-xs text-muted-foreground">Guven Skoru</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    {/* Price & Target Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <p className="text-xs text-muted-foreground mb-1">Guncel Fiyat</p>
                        <p className="text-2xl font-bold text-foreground">
                          {selectedResult.currentPrice.toFixed(2)} <span className="text-sm text-muted-foreground">TL</span>
                        </p>
                        <div className={`flex items-center gap-1 mt-1 text-sm ${
                          selectedResult.dayChangePercent >= 0 ? "text-primary" : "text-destructive"
                        }`}>
                          {selectedResult.dayChangePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {selectedResult.dayChangePercent >= 0 ? "+" : ""}{selectedResult.dayChangePercent.toFixed(2)}%
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                        <p className="text-xs text-primary mb-1">Hedef Fiyat</p>
                        <p className="text-2xl font-bold text-primary">
                          {selectedResult.target.targetPrice.toFixed(2)} <span className="text-sm">TL</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          +{selectedResult.target.expectedGainPercent.toFixed(2)}% beklenen
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                        <p className="text-xs text-destructive mb-1">Stop Loss</p>
                        <p className="text-2xl font-bold text-destructive">
                          {selectedResult.target.stopLoss.toFixed(2)} <span className="text-sm">TL</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          -{selectedResult.target.stopLossPercent.toFixed(2)}% risk
                        </p>
                      </div>
                    </div>

                    {/* Risk/Reward & Risk Level */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">Risk/Odul Orani</span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Potansiyel kazanc / Potansiyel kayip</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-xl font-bold text-foreground mt-2">
                          1:{selectedResult.target.riskRewardRatio.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-card border border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">Risk Seviyesi</span>
                          </div>
                          <Badge variant="outline" className={getRiskColor(selectedResult.risk.level)}>
                            {selectedResult.risk.level === 'low' ? 'Dusuk' : selectedResult.risk.level === 'high' ? 'Yuksek' : 'Orta'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={selectedResult.risk.score * 10} className="h-2 flex-1" />
                          <span className="text-sm font-bold text-foreground">{selectedResult.risk.score}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Teknik Gostergeler
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">RSI (14)</p>
                          <p className={`text-lg font-semibold ${
                            selectedResult.indicators.rsi < 30 ? 'text-primary' : 
                            selectedResult.indicators.rsi > 70 ? 'text-destructive' : 'text-foreground'
                          }`}>
                            {selectedResult.indicators.rsi.toFixed(1)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">MACD</p>
                          <p className={`text-lg font-semibold ${
                            selectedResult.indicators.macd.histogram > 0 ? 'text-primary' : 'text-destructive'
                          }`}>
                            {selectedResult.indicators.macd.histogram > 0 ? 'Pozitif' : 'Negatif'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">Bollinger %B</p>
                          <p className="text-lg font-semibold text-foreground">
                            {selectedResult.indicators.bollingerBands.percentB.toFixed(0)}%
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">Stochastic</p>
                          <p className={`text-lg font-semibold ${
                            selectedResult.indicators.stochastic.k < 20 ? 'text-primary' : 
                            selectedResult.indicators.stochastic.k > 80 ? 'text-destructive' : 'text-foreground'
                          }`}>
                            {selectedResult.indicators.stochastic.k.toFixed(0)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">ADX</p>
                          <p className="text-lg font-semibold text-foreground">
                            {selectedResult.indicators.adx.toFixed(0)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">OBV Trend</p>
                          <p className={`text-lg font-semibold ${
                            selectedResult.indicators.obvTrend === 'rising' ? 'text-primary' : 
                            selectedResult.indicators.obvTrend === 'falling' ? 'text-destructive' : 'text-foreground'
                          }`}>
                            {selectedResult.indicators.obvTrend === 'rising' ? 'Yukari' : 
                             selectedResult.indicators.obvTrend === 'falling' ? 'Asagi' : 'Notr'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">ATR (14)</p>
                          <p className="text-lg font-semibold text-foreground">
                            {selectedResult.indicators.atr.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <p className="text-xs text-muted-foreground">EMA 9/21</p>
                          <p className={`text-lg font-semibold ${
                            selectedResult.indicators.ema.ema9 > selectedResult.indicators.ema.ema21 ? 'text-primary' : 'text-destructive'
                          }`}>
                            {selectedResult.indicators.ema.ema9 > selectedResult.indicators.ema.ema21 ? 'Yukari' : 'Asagi'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Signals */}
                    <div>
                      <button
                        className="w-full flex items-center justify-between font-medium text-foreground mb-3"
                        onClick={() => setExpandedSignals(!expandedSignals)}
                      >
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-primary" />
                          Aktif Sinyaller ({selectedResult.signals.length})
                        </span>
                        {expandedSignals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {expandedSignals && (
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2 pr-4">
                            {selectedResult.signals.map((signal, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border ${getSignalBadgeStyle(signal.type)}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs ${getSignalBadgeStyle(signal.type)}`}>
                                      {signal.type === 'buy' ? 'AL' : signal.type === 'sell' ? 'SAT' : 'NOTR'}
                                    </Badge>
                                    <span className="font-medium text-sm">{signal.name}</span>
                                  </div>
                                  <span className={`text-xs font-mono ${signal.points > 0 ? 'text-primary' : 'text-destructive'}`}>
                                    {signal.points > 0 ? '+' : ''}{signal.points}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{signal.description}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    {/* Risk Factors */}
                    {selectedResult.risk.factors.length > 0 && (
                      <div className="p-4 rounded-xl bg-card border border-border">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-chart-4" />
                          Risk Faktorleri
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedResult.risk.factors.map((factor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!scanning && topResults.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Pro Tarama Bekliyor</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Profesyonel taramayi baslatarak 610 BIST hissesini gercek teknik analiz ile tarayin. 
                RSI, MACD, Bollinger Bands, EMA, Stochastic, ADX ve OBV gostergeler hesaplanacak.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
