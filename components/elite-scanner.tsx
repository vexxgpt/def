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
  XCircle,
  BarChart3,
  Sparkles,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Ban,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  Percent,
  Timer,
  LineChart,
  CandlestickChart,
  Gauge,
  Eye,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BIST_STOCKS, TOTAL_STOCK_COUNT } from "@/lib/bist-stocks";
import { useTradingStore } from "@/lib/store";
import { calculateEliteIndicators } from "@/lib/elite-indicators";
import { analyzeEliteSignals } from "@/lib/elite-signal-engine";
import { generateEliteScanResult, sortEliteResults, filterEliteResults, filterUltraEliteResults, calculateCompositeScore, calculateSignalStrength } from "@/lib/elite-scoring-engine";
import type { EliteScanResult, ScanProgress, HistoricalDataResponse } from "@/lib/elite-scanner-types";

const BATCH_SIZE = 8;

export function EliteScanner() {
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
  const [allResults, setAllResults] = useState<EliteScanResult[]>([]);
  const [topResults, setTopResults] = useState<EliteScanResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<EliteScanResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [scanComplete, setScanComplete] = useState(false);

  const { addAlert } = useTradingStore();

  const startEliteScan = useCallback(async () => {
    setScanning(true);
    setScanComplete(false);
    setTopResults([]);
    setAllResults([]);
    setSelectedResult(null);

    const allSymbols = [...BIST_STOCKS];
    const totalBatches = Math.ceil(allSymbols.length / BATCH_SIZE);
    const results: EliteScanResult[] = [];

    addAlert({
      symbol: "ELITE-TARAYICI",
      type: "bilgi",
      message: `Elite tarama baslatildi: ${TOTAL_STOCK_COUNT} hisse, profesyonel analiz`,
    });

    setProgress({
      phase: 'initializing',
      currentBatch: 0,
      totalBatches,
      scannedCount: 0,
      totalCount: allSymbols.length,
      percentComplete: 0,
      message: 'Sistem hazirlaniyor...',
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      const batch = allSymbols.slice(i, i + BATCH_SIZE);
      const currentBatch = Math.floor(i / BATCH_SIZE) + 1;

      setProgress(prev => ({
        ...prev,
        phase: 'fetching',
        currentBatch,
        currentSymbol: batch[0],
        message: `Batch ${currentBatch}/${totalBatches} - Veri aliniyor...`,
      }));

      try {
        const res = await fetch('/api/stocks/historical', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: batch, days: 60 }), // 60 gun veri
        });

        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
          setProgress(prev => ({
            ...prev,
            phase: 'analyzing',
            message: `Batch ${currentBatch}/${totalBatches} - Elite analiz yapiliyor...`,
          }));

          for (const stockData of data.data as HistoricalDataResponse[]) {
            if (stockData.bars && stockData.bars.length >= 30) {
              try {
                // Elite teknik indikatorler
                const indicators = calculateEliteIndicators(stockData.bars);

                // Elite sinyaller
                const signals = analyzeEliteSignals(
                  indicators,
                  stockData.currentQuote.price,
                  stockData.currentQuote.changePercent
                );

                // Elite sonuc uret
                const result = generateEliteScanResult({
                  symbol: stockData.symbol,
                  name: stockData.currentQuote.name,
                  currentPrice: stockData.currentQuote.price,
                  open: stockData.bars[stockData.bars.length - 1]?.open || stockData.currentQuote.price,
                  high: stockData.currentQuote.dayHigh,
                  low: stockData.currentQuote.dayLow,
                  previousClose: stockData.currentQuote.previousClose,
                  volume: stockData.currentQuote.volume,
                  fiftyTwoWeekHigh: stockData.currentQuote.fiftyTwoWeekHigh || Math.max(...stockData.bars.map(b => b.high)),
                  fiftyTwoWeekLow: stockData.currentQuote.fiftyTwoWeekLow || Math.min(...stockData.bars.map(b => b.low)),
                  indicators,
                  signals,
                });

                results.push(result);
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
        estimatedTimeRemaining: Math.round((totalBatches - currentBatch) * 2),
      }));

      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Siralama ve filtreleme
    setProgress(prev => ({
      ...prev,
      phase: 'ranking',
      percentComplete: 95,
      message: 'Elite siralama ve filtreleme...',
    }));

    await new Promise(resolve => setTimeout(resolve, 500));

    const sorted = sortEliteResults(results);
    const ultraElite = filterUltraEliteResults(sorted); // TOP 5 Ultra-Elite
    const filtered = filterEliteResults(sorted);

    setProgress({
      phase: 'complete',
      currentBatch: totalBatches,
      totalBatches,
      scannedCount: allSymbols.length,
      totalCount: allSymbols.length,
      percentComplete: 100,
      message: 'Elite tarama tamamlandi!',
    });

    setAllResults(sorted);
    // Ultra-Elite varsa onlari goster, yoksa normal filtrelenmis sonuclarin ilk 5'ini
    const top5 = ultraElite.length > 0 ? ultraElite : filtered.slice(0, 5);
    setTopResults(top5);
    setScanComplete(true);
    setScanning(false);

    if (top5.length > 0) {
      setSelectedResult(top5[0]);
    }

    const strongBuys = top5.filter(r => r.decision.action === 'STRONG_BUY').length;
    const buys = top5.filter(r => r.decision.action === 'BUY').length;
    const avgConviction = top5.length > 0 
      ? Math.round(top5.reduce((sum, r) => sum + r.decision.conviction, 0) / top5.length)
      : 0;

    addAlert({
      symbol: "ELITE-TARAYICI",
      type: "basari",
      message: `ULTRA-ELITE tarama tamamlandi! ${results.length} hisse analiz edildi. TOP 5 secildi: ${strongBuys} GUCLU ALIM, ${buys} ALIM. Ortalama Guven: %${avgConviction}`,
    });
  }, [addAlert]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'STRONG_BUY': return 'bg-primary/20 text-primary border-primary/50';
      case 'BUY': return 'bg-chart-2/20 text-chart-2 border-chart-2/50';
      case 'HOLD': return 'bg-chart-4/20 text-chart-4 border-chart-4/50';
      case 'SELL': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'AVOID': return 'bg-destructive/30 text-destructive border-destructive';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'STRONG_BUY': return <ThumbsUp className="h-4 w-4" />;
      case 'BUY': return <TrendingUp className="h-4 w-4" />;
      case 'HOLD': return <Scale className="h-4 w-4" />;
      case 'SELL': return <TrendingDown className="h-4 w-4" />;
      case 'AVOID': return <Ban className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-primary font-bold';
      case 'A': return 'text-primary';
      case 'B+': return 'text-chart-2';
      case 'B': return 'text-chart-4';
      case 'C+': return 'text-chart-4';
      case 'C': return 'text-muted-foreground';
      case 'D': return 'text-destructive';
      case 'F': return 'text-destructive font-bold';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'very_low': return 'bg-primary/20 text-primary border-primary/30';
      case 'low': return 'bg-primary/15 text-primary border-primary/25';
      case 'medium': return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'very_high': return 'bg-destructive/30 text-destructive border-destructive/40';
      case 'extreme': return 'bg-destructive text-destructive-foreground border-destructive';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'very_low':
      case 'low':
        return <ShieldCheck className="h-4 w-4" />;
      case 'medium':
        return <Shield className="h-4 w-4" />;
      case 'high':
      case 'very_high':
      case 'extreme':
        return <ShieldAlert className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const formatTL = (value: number) => {
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
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
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground flex items-center gap-2">
                    Elite Hisse Tarayici
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      PROFESYONEL
                    </Badge>
                  </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {TOTAL_STOCK_COUNT} hisse - 35+ Indikator - Min %85 Guven - TOP 5 Ultra-Elite - Pro Trader Modu
                </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Kapanisa 30dk Kala</span>
                </div>
                <Button
                  size="lg"
                  onClick={startEliteScan}
                  disabled={scanning}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-green"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Elite Tarama...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Elite Taramayi Baslat
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
                    {progress.currentSymbol && (
                      <span className="font-mono text-primary">{progress.currentSymbol}</span>
                    )}
                  </span>
                  <span className="font-mono font-medium text-primary">
                    {progress.scannedCount} / {progress.totalCount}
                  </span>
                </div>
                <Progress value={progress.percentComplete} className="h-3 bg-muted" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Faz: {
                      progress.phase === 'initializing' ? 'Baslangic' :
                      progress.phase === 'fetching' ? 'Veri Toplama' :
                      progress.phase === 'analyzing' ? 'Elite Analiz' :
                      progress.phase === 'ranking' ? 'Siralama' :
                      progress.phase === 'complete' ? 'Tamamlandi' : 'Bekleniyor'
                    }
                  </span>
                  <span>{progress.percentComplete}%</span>
                  {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                    <span>~{progress.estimatedTimeRemaining} sn kaldi</span>
                  )}
                </div>
              </div>
            )}

            {/* Scan Complete Summary */}
            {scanComplete && !scanning && (
              <div className={`mt-4 p-4 rounded-xl border ${
                topResults.length > 0 
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-chart-4/10 border-chart-4/30'
              }`}>
                <div className="flex items-start gap-3">
                  {topResults.length > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-chart-4 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {topResults.length > 0 
                        ? 'Ultra-Elite Tarama Tamamlandi' 
                        : 'Tarama Tamamlandi - Kriter Karsilanmadi'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {allResults.length} hisse analiz edildi.
                      {topResults.length > 0 ? (
                        <>
                          {' '}
                          <span className="text-primary font-semibold">
                            TOP {topResults.length} Ultra-Elite firsat secildi!
                          </span>
                          {topResults.filter(r => r.decision.action === 'STRONG_BUY').length > 0 && (
                            <span className="text-primary font-medium">
                              {' '}({topResults.filter(r => r.decision.action === 'STRONG_BUY').length} GUCLU ALIM)
                            </span>
                          )}
                          <span className="block text-xs mt-1">
                            Minimum %85 guven, dusuk risk, en az 5 alim sinyali, pozitif trend hizalama
                          </span>
                        </>
                      ) : (
                        <span className="block text-chart-4">
                          Hicbir hisse %85 guven esigini, dusuk risk seviyesini ve diger profesyonel kriterleri karsilayamadi. 
                          Bu, piyasa kosullarinin zorlu oldugu anlamina gelebilir. Daha sonra tekrar deneyin.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* Results Grid */}
        {topResults.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Top Results List */}
            <div className="xl:col-span-1 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  TOP {topResults.length} Ultra-Elite Firsatlar
                </h3>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  Min %85 Guven
                </Badge>
              </div>
              <ScrollArea className="h-[700px]">
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
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg font-bold text-lg shrink-0 ${
                            index < 3 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">{stock.symbol}</span>
                              <Badge variant="outline" className={`text-xs ${getActionColor(stock.decision.action)}`}>
                                {getActionIcon(stock.decision.action)}
                                <span className="ml-1">{stock.decision.action.replace('_', ' ')}</span>
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{stock.name}</p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-medium text-foreground">
                                {formatTL(stock.price.current)}
                              </span>
                              <span className={`text-xs flex items-center gap-1 ${
                                stock.price.changePercent >= 0 ? "text-primary" : "text-destructive"
                              }`}>
                                {stock.price.changePercent >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {stock.price.changePercent >= 0 ? "+" : ""}{stock.price.changePercent.toFixed(2)}%
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-sm font-bold ${getGradeColor(stock.score.grade)}`}>
                                {stock.score.grade}
                              </span>
                              <Separator orientation="vertical" className="h-4" />
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                stock.decision.conviction >= 90 
                                  ? 'bg-primary/20 text-primary' 
                                  : stock.decision.conviction >= 85 
                                  ? 'bg-chart-2/20 text-chart-2'
                                  : 'bg-chart-4/20 text-chart-4'
                              }`}>
                                %{stock.decision.conviction} Guven
                              </span>
                              <Separator orientation="vertical" className="h-4" />
                              <Badge variant="outline" className={`text-xs px-1.5 py-0 ${getRiskColor(stock.risk.level)}`}>
                                {getRiskIcon(stock.risk.level)}
                              </Badge>
                            </div>
                            
                            {/* Pro Analysis Summary - TradingView Style */}
                            {stock.signalStrength && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <Badge variant="outline" className={`text-xs px-2 py-0.5 font-semibold ${
                                  stock.signalStrength.label === 'GUCLU AL' 
                                    ? 'bg-primary/20 text-primary border-primary/40' 
                                    : stock.signalStrength.label === 'AL'
                                    ? 'bg-chart-2/20 text-chart-2 border-chart-2/40'
                                    : stock.signalStrength.label === 'NOTR'
                                    ? 'bg-chart-4/20 text-chart-4 border-chart-4/40'
                                    : 'bg-destructive/20 text-destructive border-destructive/40'
                                }`}>
                                  {stock.signalStrength.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Skor: <span className="font-semibold text-foreground">{stock.compositeScore}</span>/100
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({stock.signalStrength.summary.buy}A/{stock.signalStrength.summary.neutral}N/{stock.signalStrength.summary.sell}S)
                                </span>
                              </div>
                            )}
                            {!stock.signalStrength && stock.decision.proAnalysis && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs px-1.5 py-0 bg-amber-500/10 text-amber-500 border-amber-500/30">
                                  Giris: {stock.decision.proAnalysis.entryQuality}
                                </Badge>
                                {stock.decision.proAnalysis.institutionalSignal !== 'none' && (
                                  <Badge variant="outline" className={`text-xs px-1.5 py-0 ${
                                    stock.decision.proAnalysis.institutionalSignal === 'strong' 
                                      ? 'bg-primary/10 text-primary border-primary/30' 
                                      : 'bg-chart-2/10 text-chart-2 border-chart-2/30'
                                  }`}>
                                    Kurumsal: {stock.decision.proAnalysis.institutionalSignal.charAt(0).toUpperCase() + stock.decision.proAnalysis.institutionalSignal.slice(1)}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                  Conf: {stock.decision.proAnalysis.confluenceScore}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Detailed Analysis Panel */}
            {selectedResult && (
              <div className="xl:col-span-2">
                <Card className="border-primary/30">
                  <CardHeader className="border-b border-border pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-2xl text-foreground">{selectedResult.symbol}</CardTitle>
                          <Badge variant="outline" className="text-muted-foreground">
                            {selectedResult.sector}
                          </Badge>
                          <Badge variant="outline" className={`${getActionColor(selectedResult.decision.action)}`}>
                            {getActionIcon(selectedResult.decision.action)}
                            <span className="ml-1 font-semibold">{selectedResult.decision.action.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{selectedResult.name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getGradeColor(selectedResult.score.grade)}`}>
                            {selectedResult.score.grade}
                          </div>
                          <p className="text-xs text-muted-foreground">Grade</p>
                        </div>
                        <Separator orientation="vertical" className="h-12" />
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {selectedResult.decision.conviction}%
                          </div>
                          <p className="text-xs text-muted-foreground">Guven</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                        <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                          <Eye className="h-4 w-4 mr-2" />
                          Genel Bakis
                        </TabsTrigger>
                        <TabsTrigger value="signals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                          <Zap className="h-4 w-4 mr-2" />
                          Sinyaller ({selectedResult.signals.length})
                        </TabsTrigger>
                        <TabsTrigger value="risk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                          <Shield className="h-4 w-4 mr-2" />
                          Risk Analizi
                        </TabsTrigger>
                        <TabsTrigger value="targets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                          <Target className="h-4 w-4 mr-2" />
                          Hedefler
                        </TabsTrigger>
                        <TabsTrigger value="technicals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                          <LineChart className="h-4 w-4 mr-2" />
                          Teknik
                        </TabsTrigger>
                      </TabsList>

                      {/* Overview Tab */}
                      <TabsContent value="overview" className="p-6 space-y-6">
                        {/* Decision Reasoning */}
                        <div className={`p-4 rounded-xl border ${
                          selectedResult.decision.action === 'STRONG_BUY' || selectedResult.decision.action === 'BUY'
                            ? 'bg-primary/10 border-primary/30'
                            : selectedResult.decision.action === 'AVOID' || selectedResult.decision.action === 'SELL'
                            ? 'bg-destructive/10 border-destructive/30'
                            : 'bg-muted/50 border-border'
                        }`}>
                          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                            {getActionIcon(selectedResult.decision.action)}
                            Karar Gerekceleri
                          </h4>
                          <ul className="space-y-1">
                            {selectedResult.decision.reasoning.map((reason, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 rounded-xl bg-card border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-xs">Guncel Fiyat</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">{formatTL(selectedResult.price.current)}</p>
                            <p className={`text-xs ${selectedResult.price.changePercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {selectedResult.price.changePercent >= 0 ? '+' : ''}{selectedResult.price.changePercent.toFixed(2)}% bugun
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                            <div className="flex items-center gap-2 text-primary mb-1">
                              <Target className="h-4 w-4" />
                              <span className="text-xs">Hedef (Orta)</span>
                            </div>
                            <p className="text-xl font-bold text-primary">{formatTL(selectedResult.target.targets.moderate.price)}</p>
                            <p className="text-xs text-muted-foreground">
                              +{selectedResult.target.targets.moderate.percent.toFixed(2)}% ({selectedResult.target.targets.moderate.probability}% olasi)
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                            <div className="flex items-center gap-2 text-destructive mb-1">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs">Stop Loss</span>
                            </div>
                            <p className="text-xl font-bold text-destructive">{formatTL(selectedResult.risk.stopLossLevels.normal.price)}</p>
                            <p className="text-xs text-muted-foreground">
                              -{selectedResult.risk.stopLossLevels.normal.percent.toFixed(2)}% risk
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-card border border-border">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Scale className="h-4 w-4" />
                              <span className="text-xs">Risk/Odul</span>
                            </div>
                            <p className="text-xl font-bold text-foreground">1:{selectedResult.target.riskRewardRatios.moderate.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedResult.target.riskRewardRatios.moderate >= 2 ? 'Mukemmel' : 
                               selectedResult.target.riskRewardRatios.moderate >= 1.5 ? 'Iyi' : 'Orta'}
                            </p>
                          </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {[
                            { label: 'Genel', value: selectedResult.score.overall, icon: Gauge },
                            { label: 'Teknik', value: selectedResult.score.technical, icon: LineChart },
                            { label: 'Momentum', value: selectedResult.score.momentum, icon: Zap },
                            { label: 'Trend', value: selectedResult.score.trend, icon: TrendingUp },
                            { label: 'Hacim', value: selectedResult.score.volume, icon: BarChart3 },
                          ].map((item) => (
                            <div key={item.label} className="p-3 rounded-xl bg-card border border-border">
                              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <item.icon className="h-4 w-4" />
                                <span className="text-xs">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={item.value} 
                                  className="h-2 flex-1" 
                                />
                                <span className="text-sm font-medium">{item.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* TRADINGVIEW STYLE SIGNAL STRENGTH GAUGE */}
                        {selectedResult.signalStrength && (
                          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-chart-2/5 border border-primary/20">
                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Activity className="h-5 w-5 text-primary" />
                              Sinyal Gucu Analizi
                              <Badge variant="outline" className={`text-xs font-bold ${
                                selectedResult.signalStrength.label === 'GUCLU AL' 
                                  ? 'bg-primary/20 text-primary border-primary/40' 
                                  : selectedResult.signalStrength.label === 'AL'
                                  ? 'bg-chart-2/20 text-chart-2 border-chart-2/40'
                                  : selectedResult.signalStrength.label === 'NOTR'
                                  ? 'bg-chart-4/20 text-chart-4 border-chart-4/40'
                                  : 'bg-destructive/20 text-destructive border-destructive/40'
                              }`}>
                                {selectedResult.signalStrength.label}
                              </Badge>
                            </h4>
                            
                            {/* Kompozit Skor */}
                            <div className="mb-6 p-4 rounded-lg bg-background/50 border border-border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Kompozit Skor</span>
                                <span className={`text-3xl font-bold ${
                                  (selectedResult.compositeScore || 0) >= 70 ? 'text-primary' :
                                  (selectedResult.compositeScore || 0) >= 50 ? 'text-chart-2' :
                                  (selectedResult.compositeScore || 0) >= 35 ? 'text-chart-4' : 'text-destructive'
                                }`}>
                                  {selectedResult.compositeScore || 0}/100
                                </span>
                              </div>
                              <Progress value={selectedResult.compositeScore || 0} className="h-3" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Osilatorler */}
                              <div className="p-3 rounded-lg bg-background/50 border border-border">
                                <div className="text-sm font-medium text-muted-foreground mb-3">Osilatorler</div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-xs">Al</span>
                                    <span className="font-semibold text-primary">{selectedResult.signalStrength.oscillators.buy}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-chart-4"></div>
                                    <span className="text-xs">Notr</span>
                                    <span className="font-semibold text-chart-4">{selectedResult.signalStrength.oscillators.neutral}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                                    <span className="text-xs">Sat</span>
                                    <span className="font-semibold text-destructive">{selectedResult.signalStrength.oscillators.sell}</span>
                                  </div>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                                  <div 
                                    className="bg-primary transition-all" 
                                    style={{ width: `${(selectedResult.signalStrength.oscillators.buy / (selectedResult.signalStrength.oscillators.buy + selectedResult.signalStrength.oscillators.neutral + selectedResult.signalStrength.oscillators.sell)) * 100}%` }}
                                  />
                                  <div 
                                    className="bg-chart-4 transition-all" 
                                    style={{ width: `${(selectedResult.signalStrength.oscillators.neutral / (selectedResult.signalStrength.oscillators.buy + selectedResult.signalStrength.oscillators.neutral + selectedResult.signalStrength.oscillators.sell)) * 100}%` }}
                                  />
                                  <div 
                                    className="bg-destructive transition-all" 
                                    style={{ width: `${(selectedResult.signalStrength.oscillators.sell / (selectedResult.signalStrength.oscillators.buy + selectedResult.signalStrength.oscillators.neutral + selectedResult.signalStrength.oscillators.sell)) * 100}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Hareketli Ortalamalar */}
                              <div className="p-3 rounded-lg bg-background/50 border border-border">
                                <div className="text-sm font-medium text-muted-foreground mb-3">Hareketli Ortalamalar</div>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-xs">Al</span>
                                    <span className="font-semibold text-primary">{selectedResult.signalStrength.movingAverages.buy}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-chart-4"></div>
                                    <span className="text-xs">Notr</span>
                                    <span className="font-semibold text-chart-4">{selectedResult.signalStrength.movingAverages.neutral}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                                    <span className="text-xs">Sat</span>
                                    <span className="font-semibold text-destructive">{selectedResult.signalStrength.movingAverages.sell}</span>
                                  </div>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                                  <div 
                                    className="bg-primary transition-all" 
                                    style={{ width: `${(selectedResult.signalStrength.movingAverages.buy / (selectedResult.signalStrength.movingAverages.buy + selectedResult.signalStrength.movingAverages.neutral + selectedResult.signalStrength.movingAverages.sell)) * 100}%` }}
                                  />
                                  <div 
                                    className="bg-chart-4 transition-all" 
                                    style={{ width: `${(selectedResult.signalStrength.movingAverages.neutral / (selectedResult.signalStrength.movingAverages.buy + selectedResult.signalStrength.movingAverages.neutral + selectedResult.signalStrength.movingAverages.sell)) * 100}%` }}
                                  />
                                  <div 
                                    className="bg-destructive transition-all" 
                                    style={{ width: `${(selectedResult.signalStrength.movingAverages.sell / (selectedResult.signalStrength.movingAverages.buy + selectedResult.signalStrength.movingAverages.neutral + selectedResult.signalStrength.movingAverages.sell)) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Toplam Ozet */}
                            <div className="mt-4 p-3 rounded-lg bg-background border border-primary/20">
                              <div className="text-sm font-medium text-center mb-2">Toplam Teknik Sinyal</div>
                              <div className="flex items-center justify-center gap-6">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-primary">{selectedResult.signalStrength.summary.buy}</div>
                                  <div className="text-xs text-muted-foreground">Al</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-chart-4">{selectedResult.signalStrength.summary.neutral}</div>
                                  <div className="text-xs text-muted-foreground">Notr</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-destructive">{selectedResult.signalStrength.summary.sell}</div>
                                  <div className="text-xs text-muted-foreground">Sat</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PRO ANALYSIS - YENİ BÖLÜM */}
                        {selectedResult.decision.proAnalysis && (
                          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-primary/10 border border-amber-500/30">
                            <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-amber-500" />
                              Pro Trader Analizi
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                                PROFESYONEL
                              </Badge>
                            </h4>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="p-3 rounded-lg bg-background/50 border border-border">
                                <div className="text-xs text-muted-foreground mb-1">Confluence Skoru</div>
                                <div className="text-2xl font-bold text-amber-500">
                                  {selectedResult.decision.proAnalysis.confluenceScore}/100
                                </div>
                                <Progress value={selectedResult.decision.proAnalysis.confluenceScore} className="h-1 mt-2" />
                              </div>
                              
                              <div className="p-3 rounded-lg bg-background/50 border border-border">
                                <div className="text-xs text-muted-foreground mb-1">Trend Hizalama</div>
                                <div className="text-2xl font-bold text-primary">
                                  {selectedResult.decision.proAnalysis.trendAlignment}/100
                                </div>
                                <Progress value={selectedResult.decision.proAnalysis.trendAlignment} className="h-1 mt-2" />
                              </div>
                              
                              <div className="p-3 rounded-lg bg-background/50 border border-border">
                                <div className="text-xs text-muted-foreground mb-1">Momentum Kalitesi</div>
                                <div className="text-2xl font-bold text-chart-2">
                                  {selectedResult.decision.proAnalysis.momentumQuality}/100
                                </div>
                                <Progress value={selectedResult.decision.proAnalysis.momentumQuality} className="h-1 mt-2" />
                              </div>
                              
                              <div className="p-3 rounded-lg bg-background/50 border border-border">
                                <div className="text-xs text-muted-foreground mb-1">Risk Adj. Return</div>
                                <div className="text-2xl font-bold text-foreground">
                                  {selectedResult.decision.proAnalysis.riskAdjustedReturn.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-3">
                              <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
                                <div className="text-xs text-muted-foreground mb-1">Kurumsal Sinyal</div>
                                <Badge variant="outline" className={`text-sm ${
                                  selectedResult.decision.proAnalysis.institutionalSignal === 'strong' 
                                    ? 'bg-primary/20 text-primary border-primary/30' 
                                    : selectedResult.decision.proAnalysis.institutionalSignal === 'moderate'
                                    ? 'bg-chart-2/20 text-chart-2 border-chart-2/30'
                                    : selectedResult.decision.proAnalysis.institutionalSignal === 'weak'
                                    ? 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                                    : 'bg-muted text-muted-foreground border-border'
                                }`}>
                                  {selectedResult.decision.proAnalysis.institutionalSignal.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
                                <div className="text-xs text-muted-foreground mb-1">Piyasa Zamanlama</div>
                                <Badge variant="outline" className={`text-sm ${
                                  selectedResult.decision.proAnalysis.marketTiming === 'optimal' 
                                    ? 'bg-primary/20 text-primary border-primary/30' 
                                    : selectedResult.decision.proAnalysis.marketTiming === 'good'
                                    ? 'bg-chart-2/20 text-chart-2 border-chart-2/30'
                                    : selectedResult.decision.proAnalysis.marketTiming === 'neutral'
                                    ? 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                                    : 'bg-destructive/20 text-destructive border-destructive/30'
                                }`}>
                                  {selectedResult.decision.proAnalysis.marketTiming.toUpperCase()}
                                </Badge>
                              </div>
                              
                              <div className="p-3 rounded-lg bg-background/50 border border-border text-center">
                                <div className="text-xs text-muted-foreground mb-1">Giris Kalitesi</div>
                                <div className={`text-2xl font-bold ${
                                  selectedResult.decision.proAnalysis.entryQuality === 'A' 
                                    ? 'text-primary' 
                                    : selectedResult.decision.proAnalysis.entryQuality === 'B'
                                    ? 'text-chart-2'
                                    : selectedResult.decision.proAnalysis.entryQuality === 'C'
                                    ? 'text-chart-4'
                                    : 'text-destructive'
                                }`}>
                                  {selectedResult.decision.proAnalysis.entryQuality}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Deal Breakers */}
                        {selectedResult.risk.dealBreakers.length > 0 && (
                          <div className="p-4 rounded-xl bg-destructive/20 border border-destructive">
                            <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                              <XCircle className="h-5 w-5" />
                              KRITIK UYARILAR - ALMAYINIZ!
                            </h4>
                            <ul className="space-y-1">
                              {selectedResult.risk.dealBreakers.map((db, idx) => (
                                <li key={idx} className="text-sm text-destructive flex items-start gap-2">
                                  <Ban className="h-4 w-4 mt-0.5 shrink-0" />
                                  {db}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TabsContent>

                      {/* Signals Tab */}
                      <TabsContent value="signals" className="p-6">
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {selectedResult.signals.map((signal) => (
                              <div
                                key={signal.id}
                                className={`p-3 rounded-lg border ${
                                  signal.type === 'strong_buy' ? 'bg-primary/15 border-primary/40' :
                                  signal.type === 'buy' ? 'bg-primary/10 border-primary/30' :
                                  signal.type === 'strong_sell' ? 'bg-destructive/15 border-destructive/40' :
                                  signal.type === 'sell' ? 'bg-destructive/10 border-destructive/30' :
                                  'bg-muted/30 border-border'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium ${
                                        signal.type.includes('buy') ? 'text-primary' :
                                        signal.type.includes('sell') ? 'text-destructive' :
                                        'text-muted-foreground'
                                      }`}>
                                        {signal.name}
                                      </span>
                                      <Badge variant="outline" className="text-xs">
                                        {signal.category}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{signal.description}</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className={`text-lg font-bold ${
                                      signal.points > 0 ? 'text-primary' : 'text-destructive'
                                    }`}>
                                      {signal.points > 0 ? '+' : ''}{signal.points}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <span>Guc: {signal.weight}/5</span>
                                      <span>•</span>
                                      <span>{signal.reliability}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      {/* Risk Tab */}
                      <TabsContent value="risk" className="p-6 space-y-6">
                        {/* Risk Score Overview */}
                        <div className="flex items-center gap-6">
                          <div className={`p-6 rounded-xl border-2 ${getRiskColor(selectedResult.risk.level)}`}>
                            <div className="text-center">
                              <div className="text-4xl font-bold">{selectedResult.risk.score}</div>
                              <div className="text-sm mt-1 uppercase">{selectedResult.risk.level.replace('_', ' ')}</div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            {Object.entries(selectedResult.risk.factors).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground w-32 capitalize">
                                  {key.replace('Risk', '')}
                                </span>
                                <Progress value={value} className="h-2 flex-1" />
                                <span className="text-xs font-medium w-8">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Position Sizing */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-card border border-border">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Onerilen Pozisyon</h4>
                            <p className="text-2xl font-bold text-primary">%{selectedResult.risk.recommendedPositionSize}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              1M TL icin: {formatTL(1000000 * selectedResult.risk.recommendedPositionSize / 100)}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-card border border-border">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Max Pozisyon</h4>
                            <p className="text-2xl font-bold text-foreground">%{selectedResult.risk.maxPositionSize}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              1M TL icin: {formatTL(1000000 * selectedResult.risk.maxPositionSize / 100)}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-card border border-border">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Kelly %</h4>
                            <p className="text-2xl font-bold text-foreground">%{selectedResult.risk.kellyPercentage}</p>
                            <p className="text-xs text-muted-foreground mt-1">Optimal pozisyon boyutu</p>
                          </div>
                        </div>

                        {/* Stop Loss Levels */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(selectedResult.risk.stopLossLevels).map(([level, data]) => (
                            <div key={level} className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                              <h4 className="text-sm font-medium text-destructive capitalize mb-2">
                                {level === 'tight' ? 'Siki' : level === 'normal' ? 'Normal' : 'Genis'} Stop
                              </h4>
                              <p className="text-xl font-bold text-destructive">{formatTL(data.price)}</p>
                              <p className="text-xs text-muted-foreground mt-1">-%{data.percent} kayip</p>
                            </div>
                          ))}
                        </div>

                        {/* Warnings */}
                        {selectedResult.risk.warnings.length > 0 && (
                          <div className="p-4 rounded-xl bg-chart-4/10 border border-chart-4/30">
                            <h4 className="font-medium text-chart-4 mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Uyarilar
                            </h4>
                            <ul className="space-y-1">
                              {selectedResult.risk.warnings.map((warning, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-chart-4">•</span>
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </TabsContent>

                      {/* Targets Tab */}
                      <TabsContent value="targets" className="p-6 space-y-6">
                        {/* Target Prices */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(selectedResult.target.targets).map(([level, data]) => (
                            <div key={level} className={`p-4 rounded-xl border ${
                              level === 'conservative' ? 'bg-primary/5 border-primary/20' :
                              level === 'moderate' ? 'bg-primary/10 border-primary/30' :
                              'bg-primary/15 border-primary/40'
                            }`}>
                              <h4 className="text-sm font-medium text-primary capitalize mb-2">
                                {level === 'conservative' ? 'Muhafazakar' : 
                                 level === 'moderate' ? 'Orta' : 'Agresif'} Hedef
                              </h4>
                              <p className="text-2xl font-bold text-primary">{formatTL(data.price)}</p>
                              <div className="flex items-center justify-between mt-2 text-xs">
                                <span className="text-muted-foreground">+{data.percent.toFixed(2)}%</span>
                                <Badge variant="outline" className="text-xs">
                                  {data.probability}% olasi
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Technical Targets */}
                        <div className="p-4 rounded-xl bg-card border border-border">
                          <h4 className="font-medium text-foreground mb-3">Teknik Hedefler</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                              { label: 'Pivot R1', value: selectedResult.target.technicalTargets.pivotR1 },
                              { label: 'BB Orta', value: selectedResult.target.technicalTargets.bollingerMiddle },
                              { label: 'BB Ust', value: selectedResult.target.technicalTargets.bollingerUpper },
                              { label: 'ATR Hedef', value: selectedResult.target.technicalTargets.atrTarget },
                              { label: 'Fib %38.2', value: selectedResult.target.technicalTargets.fibTarget382 },
                              { label: 'Fib %61.8', value: selectedResult.target.technicalTargets.fibTarget618 },
                            ].map((item) => (
                              <div key={item.label} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                                <span className="text-xs text-muted-foreground">{item.label}</span>
                                <span className="text-sm font-medium">{formatTL(item.value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Time Estimate */}
                        <div className="p-4 rounded-xl bg-card border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Timer className="h-4 w-4" />
                            <span className="text-sm">Beklenen Sure</span>
                          </div>
                          <p className="text-lg font-medium text-foreground">
                            {selectedResult.target.expectedTimeframe === 'intraday' ? 'Gun ici' :
                             selectedResult.target.expectedTimeframe === '1-3_days' ? '1-3 Gun' :
                             selectedResult.target.expectedTimeframe === '1_week' ? '1 Hafta' :
                             selectedResult.target.expectedTimeframe === '2_weeks' ? '2 Hafta' :
                             '1 Ay'}
                          </p>
                        </div>
                      </TabsContent>

                      {/* Technicals Tab */}
                      <TabsContent value="technicals" className="p-6 space-y-6">
                        {/* Key Indicators */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <div className="text-xs text-muted-foreground mb-1">RSI (14)</div>
                            <div className={`text-xl font-bold ${
                              selectedResult.indicators.rsi.current < 30 ? 'text-primary' :
                              selectedResult.indicators.rsi.current > 70 ? 'text-destructive' :
                              'text-foreground'
                            }`}>
                              {selectedResult.indicators.rsi.current.toFixed(1)}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <div className="text-xs text-muted-foreground mb-1">MACD</div>
                            <div className={`text-xl font-bold ${
                              selectedResult.indicators.macd.histogram > 0 ? 'text-primary' : 'text-destructive'
                            }`}>
                              {selectedResult.indicators.macd.histogram.toFixed(3)}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <div className="text-xs text-muted-foreground mb-1">ADX</div>
                            <div className="text-xl font-bold text-foreground">
                              {selectedResult.indicators.adx.value.toFixed(1)}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-card border border-border">
                            <div className="text-xs text-muted-foreground mb-1">ATR %</div>
                            <div className="text-xl font-bold text-foreground">
                              {selectedResult.indicators.atr.percent.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {/* Trend Analysis */}
                        <div className="p-4 rounded-xl bg-card border border-border">
                          <h4 className="font-medium text-foreground mb-3">Trend Analizi</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">EMA Dizilimi</div>
                              <Badge variant="outline" className={
                                selectedResult.indicators.ema.alignment.includes('bullish') ? 'bg-primary/20 text-primary' :
                                selectedResult.indicators.ema.alignment.includes('bearish') ? 'bg-destructive/20 text-destructive' :
                                'bg-muted'
                              }>
                                {selectedResult.indicators.ema.alignment.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Gunluk Trend</div>
                              <Badge variant="outline" className={
                                selectedResult.indicators.dailyTrend === 'up' ? 'bg-primary/20 text-primary' :
                                selectedResult.indicators.dailyTrend === 'down' ? 'bg-destructive/20 text-destructive' :
                                'bg-muted'
                              }>
                                {selectedResult.indicators.dailyTrend}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Haftalik Trend</div>
                              <Badge variant="outline" className={
                                selectedResult.indicators.weeklyTrend === 'up' ? 'bg-primary/20 text-primary' :
                                selectedResult.indicators.weeklyTrend === 'down' ? 'bg-destructive/20 text-destructive' :
                                'bg-muted'
                              }>
                                {selectedResult.indicators.weeklyTrend}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Ichimoku</div>
                              <Badge variant="outline" className={
                                selectedResult.indicators.ichimoku.signal.includes('buy') ? 'bg-primary/20 text-primary' :
                                selectedResult.indicators.ichimoku.signal.includes('sell') ? 'bg-destructive/20 text-destructive' :
                                'bg-muted'
                              }>
                                {selectedResult.indicators.ichimoku.signal.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Volume Analysis */}
                        <div className="p-4 rounded-xl bg-card border border-border">
                          <h4 className="font-medium text-foreground mb-3">Hacim Analizi</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Hacim/Ort</div>
                              <div className="text-lg font-bold">{selectedResult.volume.ratio.toFixed(2)}x</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">OBV Trend</div>
                              <Badge variant="outline" className={
                                selectedResult.indicators.obv.trend === 'rising' ? 'bg-primary/20 text-primary' :
                                selectedResult.indicators.obv.trend === 'falling' ? 'bg-destructive/20 text-destructive' :
                                'bg-muted'
                              }>
                                {selectedResult.indicators.obv.trend}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Chaikin MF</div>
                              <div className={`text-lg font-bold ${
                                selectedResult.indicators.chaikinMF > 0.1 ? 'text-primary' :
                                selectedResult.indicators.chaikinMF < -0.1 ? 'text-destructive' :
                                'text-foreground'
                              }`}>
                                {selectedResult.indicators.chaikinMF.toFixed(3)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Acc/Dist</div>
                              <Badge variant="outline" className={
                                selectedResult.indicators.accDist.trend === 'accumulation' ? 'bg-primary/20 text-primary' :
                                selectedResult.indicators.accDist.trend === 'distribution' ? 'bg-destructive/20 text-destructive' :
                                'bg-muted'
                              }>
                                {selectedResult.indicators.accDist.trend}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!scanning && topResults.length === 0 && !scanComplete && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Ultra-Elite Tarayici Hazir</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Profesyonel teknik analiz ile 610 BIST hissesini tarayin. 
                35+ indikator, min %85 guven esigi, TOP 5 ultra-elite filtreleme.
                Sadece en guvenilir firsatlar gosterilir.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
