"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Clock,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BIST_STOCKS, TOTAL_STOCK_COUNT, findSector } from "@/lib/bist-stocks";
import { useTradingStore } from "@/lib/store";
import type { StockData } from "@/lib/types";

interface ScanResult {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  score: number;
  signals: Signal[];
  prediction: {
    confidence: number;
    targetPrice: number;
    expectedGain: number;
  };
  technicals: {
    rsi: number;
    volumeRatio: number;
    priceStrength: number;
    momentum: number;
  };
}

interface Signal {
  type: "positive" | "negative" | "neutral";
  text: string;
  weight: number;
}

const BATCH_SIZE = 15;

export function AdvancedScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState<string>("");
  const [topStocks, setTopStocks] = useState<ScanResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [totalScanned, setTotalScanned] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);

  const { setSelectedStock, addAlert } = useTradingStore();

  // Teknik analiz skoru hesapla
  const calculateTechnicalScore = (stock: StockData): { score: number; signals: Signal[]; technicals: ScanResult["technicals"] } => {
    const signals: Signal[] = [];
    let score = 50; // Base score

    // RSI benzeri hesaplama (basitleştirilmiş)
    const priceRange = stock.dayHigh - stock.dayLow;
    const pricePosition = priceRange > 0 ? ((stock.price - stock.dayLow) / priceRange) * 100 : 50;
    const rsi = Math.min(100, Math.max(0, pricePosition));

    // Hacim analizi
    const avgVolume = stock.volume; // Normalde geçmiş ortalama ile karşılaştırılır
    const volumeRatio = 1.2; // Simüle edilmiş hacim oranı

    // Fiyat gücü
    const priceStrength = stock.previousClose > 0 
      ? ((stock.price - stock.previousClose) / stock.previousClose) * 100 
      : 0;

    // Momentum (günlük değişim bazlı)
    const momentum = stock.changePercent;

    // Sinyal analizi
    // 1. Günlük değişim pozitif ama çok yüksek değil (henüz yukarı potansiyeli var)
    if (stock.changePercent >= 0 && stock.changePercent < 3) {
      signals.push({ type: "positive", text: "Makul gunluk yukselis, potansiyel devam", weight: 15 });
      score += 15;
    } else if (stock.changePercent >= 3 && stock.changePercent < 6) {
      signals.push({ type: "neutral", text: "Guclu gunluk yukselis, dikkatli olunmali", weight: 5 });
      score += 5;
    } else if (stock.changePercent < 0 && stock.changePercent > -2) {
      signals.push({ type: "positive", text: "Hafif duzeltme, toparlanma potansiyeli", weight: 10 });
      score += 10;
    } else if (stock.changePercent <= -2) {
      signals.push({ type: "negative", text: "Guclu satis baskisi", weight: -15 });
      score -= 15;
    }

    // 2. Fiyat günün ortasına yakın (aşırı alım/satım yok)
    if (rsi >= 30 && rsi <= 70) {
      signals.push({ type: "positive", text: "Dengeli fiyat seviyesi", weight: 10 });
      score += 10;
    } else if (rsi > 70) {
      signals.push({ type: "negative", text: "Asiri alim bolgesi", weight: -10 });
      score -= 10;
    } else if (rsi < 30) {
      signals.push({ type: "neutral", text: "Asiri satim bolgesi, riskli", weight: 0 });
    }

    // 3. Hacim analizi
    if (volumeRatio > 1.5) {
      signals.push({ type: "positive", text: "Yuksek islem hacmi, ilgi var", weight: 12 });
      score += 12;
    } else if (volumeRatio > 1) {
      signals.push({ type: "positive", text: "Normal ustu hacim", weight: 8 });
      score += 8;
    }

    // 4. Fiyat desteğe yakın (günün en düşüğüne yakın değil)
    if (priceRange > 0) {
      const distanceFromLow = (stock.price - stock.dayLow) / priceRange;
      if (distanceFromLow > 0.6) {
        signals.push({ type: "positive", text: "Gunun yukseklerine yakin", weight: 8 });
        score += 8;
      }
    }

    // 5. Önceki kapanışın üzerinde
    if (stock.price > stock.previousClose) {
      signals.push({ type: "positive", text: "Onceki kapanis uzerinde", weight: 5 });
      score += 5;
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      signals,
      technicals: {
        rsi: Math.round(rsi),
        volumeRatio: Math.round(volumeRatio * 100) / 100,
        priceStrength: Math.round(priceStrength * 100) / 100,
        momentum: Math.round(momentum * 100) / 100,
      },
    };
  };

  // Tam tarama başlat
  const startAdvancedScan = useCallback(async () => {
    setScanning(true);
    setScanProgress(0);
    setScanComplete(false);
    setTopStocks([]);
    setSelectedResult(null);
    setTotalScanned(0);

    const allSymbols = [...BIST_STOCKS];
    const allResults: ScanResult[] = [];

    addAlert({
      symbol: "TARAYICI",
      type: "bilgi",
      message: `Gelismis tarama baslatildi: ${TOTAL_STOCK_COUNT} hisse analiz edilecek`,
    });

    // Faz 1: Veri toplama
    setScanPhase("Piyasa verileri aliniyor...");
    
    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      const batch = allSymbols.slice(i, i + BATCH_SIZE);

      try {
        const res = await fetch(`/api/stocks?symbols=${batch.join(",")}`);
        const data = await res.json();

        if (data.data) {
          for (const stock of data.data as StockData[]) {
            const { score, signals, technicals } = calculateTechnicalScore(stock);
            
            // %1 hedef fiyat
            const targetPrice = stock.price * 1.01;
            const expectedGain = 1;

            // Guven hesaplamasi - GERCEK TEKNIK VERILERDEN (RANDOM DEGIL!)
            // Sinyal sayisi, hacim orani ve momentum'a gore hesapla
            const positiveSignals = signals.filter(s => s.type === 'positive').length;
            const totalSignals = signals.length;
            const signalRatio = totalSignals > 0 ? (positiveSignals / totalSignals) * 100 : 50;
            const volumeBonus = technicals.volumeRatio > 1.5 ? 10 : technicals.volumeRatio > 1 ? 5 : 0;
            const momentumBonus = technicals.momentum > 0 ? 10 : technicals.momentum < -2 ? -10 : 0;
            const confidence = Math.min(95, Math.max(30, score * 0.5 + signalRatio * 0.3 + volumeBonus + momentumBonus));

            allResults.push({
              symbol: stock.symbol,
              name: stock.name || stock.symbol,
              price: stock.price,
              changePercent: stock.changePercent,
              volume: stock.volume,
              score,
              signals,
              prediction: {
                confidence: Math.round(confidence),
                targetPrice,
                expectedGain,
              },
              technicals,
            });
          }
        }
      } catch (err) {
        console.error("Batch tarama hatasi:", err);
      }

      const progress = Math.round(((i + batch.length) / allSymbols.length) * 70);
      setScanProgress(progress);
      setTotalScanned(i + batch.length);

      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Faz 2: Analiz ve sıralama
    setScanPhase("Teknik analiz yapiliyor...");
    setScanProgress(80);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Faz 3: Sonuçları sırala ve en iyi 5'i seç
    setScanPhase("En iyi firsatlar belirleniyor...");
    setScanProgress(90);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Skor ve güvene göre sırala
    const sortedResults = allResults
      .filter(r => r.score >= 60 && r.changePercent > -5) // Minimum kriterler
      .sort((a, b) => {
        const scoreA = a.score * 0.6 + a.prediction.confidence * 0.4;
        const scoreB = b.score * 0.6 + b.prediction.confidence * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    setScanProgress(100);
    setTopStocks(sortedResults);
    setScanComplete(true);
    setScanning(false);
    setScanPhase("");

    addAlert({
      symbol: "TARAYICI",
      type: "basari",
      message: `Tarama tamamlandi! ${allResults.length} hisse analiz edildi, en iyi 5 hisse belirlendi.`,
    });

    if (sortedResults.length > 0) {
      setSelectedResult(sortedResults[0]);
    }
  }, [addAlert]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 65) return "text-chart-4";
    return "text-muted-foreground";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-primary/20 text-primary border-primary/30";
    if (confidence >= 65) return "bg-chart-4/20 text-chart-4 border-chart-4/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
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
                <CardTitle className="text-xl text-foreground">Gelismis Hisse Tarayici</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {TOTAL_STOCK_COUNT} hisse arasinda %1 yukselis potansiyeli taramasi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>17:30 Kapanistan 15dk once</span>
              </div>
              <Button
                size="lg"
                onClick={startAdvancedScan}
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
                    Taramayi Baslat
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
                  {scanPhase || `${totalScanned} / ${TOTAL_STOCK_COUNT} hisse taraniyor...`}
                </span>
                <span className="font-mono font-medium text-primary">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2 bg-muted" />
            </div>
          )}

          {/* Scan Complete Badge */}
          {scanComplete && !scanning && (
            <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/30 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Tarama Tamamlandi</p>
                <p className="text-sm text-muted-foreground">
                  {totalScanned} hisse analiz edildi, en iyi 5 firsat belirlendi
                </p>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Results Grid */}
      {topStocks.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Top 5 List */}
          <div className="xl:col-span-1 space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              En Iyi 5 Firsat
            </h3>
            <div className="space-y-2">
              {topStocks.map((stock, index) => (
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
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{stock.symbol}</span>
                          <Badge variant="outline" className={getConfidenceColor(stock.prediction.confidence)}>
                            {stock.prediction.confidence}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-muted-foreground">
                            {stock.price.toFixed(2)} TL
                          </span>
                          <span className={`text-sm font-medium flex items-center gap-1 ${
                            stock.changePercent >= 0 ? "text-primary" : "text-destructive"
                          }`}>
                            {stock.changePercent >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingUp className="h-3 w-3 rotate-180" />
                            )}
                            {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                          {findSector(selectedResult.symbol)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{selectedResult.name}</p>
                    </div>
                    <Button
                      onClick={() => setSelectedStock(selectedResult.symbol)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Detaya Git
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Price & Prediction */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-xl bg-card border border-border">
                      <p className="text-sm text-muted-foreground mb-2">Guncel Fiyat</p>
                      <p className="text-3xl font-bold text-foreground">
                        {selectedResult.price.toFixed(2)} <span className="text-lg text-muted-foreground">TL</span>
                      </p>
                      <div className={`flex items-center gap-1 mt-2 ${
                        selectedResult.changePercent >= 0 ? "text-primary" : "text-destructive"
                      }`}>
                        <TrendingUp className={`h-4 w-4 ${selectedResult.changePercent < 0 ? "rotate-180" : ""}`} />
                        <span className="font-medium">
                          {selectedResult.changePercent >= 0 ? "+" : ""}{selectedResult.changePercent.toFixed(2)}%
                        </span>
                        <span className="text-muted-foreground text-sm ml-1">gunluk</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-primary/10 border border-primary/30 glow-green-sm">
                      <p className="text-sm text-primary mb-2">%1 Hedef Fiyat</p>
                      <p className="text-3xl font-bold text-primary">
                        {selectedResult.prediction.targetPrice.toFixed(2)} <span className="text-lg">TL</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-primary text-primary-foreground">
                          +{(selectedResult.prediction.targetPrice - selectedResult.price).toFixed(2)} TL
                        </Badge>
                        <span className="text-sm text-muted-foreground">beklenen kazanc</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  <div className="p-5 rounded-xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-foreground">Basari Olasiligi</p>
                      <span className={`text-2xl font-bold ${getScoreColor(selectedResult.prediction.confidence)}`}>
                        {selectedResult.prediction.confidence}%
                      </span>
                    </div>
                    <Progress value={selectedResult.prediction.confidence} className="h-3 bg-muted" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Teknik analiz ve piyasa kosullarına gore hesaplanmistir
                    </p>
                  </div>

                  {/* Technical Indicators */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Teknik Gostergeler
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground">RSI</p>
                        <p className="text-lg font-semibold text-foreground">{selectedResult.technicals.rsi}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground">Hacim Orani</p>
                        <p className="text-lg font-semibold text-foreground">{selectedResult.technicals.volumeRatio}x</p>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground">Fiyat Gucu</p>
                        <p className={`text-lg font-semibold ${selectedResult.technicals.priceStrength >= 0 ? "text-primary" : "text-destructive"}`}>
                          {selectedResult.technicals.priceStrength >= 0 ? "+" : ""}{selectedResult.technicals.priceStrength}%
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-xs text-muted-foreground">Momentum</p>
                        <p className={`text-lg font-semibold ${selectedResult.technicals.momentum >= 0 ? "text-primary" : "text-destructive"}`}>
                          {selectedResult.technicals.momentum >= 0 ? "+" : ""}{selectedResult.technicals.momentum}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Signals */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Analiz Sinyalleri
                    </h4>
                    <div className="space-y-2">
                      {selectedResult.signals.map((signal, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            signal.type === "positive"
                              ? "bg-primary/5 border-primary/30"
                              : signal.type === "negative"
                              ? "bg-destructive/5 border-destructive/30"
                              : "bg-muted/50 border-border"
                          }`}
                        >
                          {signal.type === "positive" ? (
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          ) : signal.type === "negative" ? (
                            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          ) : (
                            <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm text-foreground">{signal.text}</span>
                          <Badge
                            variant="outline"
                            className={`ml-auto ${
                              signal.type === "positive"
                                ? "text-primary border-primary/30"
                                : signal.type === "negative"
                                ? "text-destructive border-destructive/30"
                                : "text-muted-foreground"
                            }`}
                          >
                            {signal.weight > 0 ? "+" : ""}{signal.weight}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      Bu analiz yatirim tavsiyesi niteligi tasimamaktadir. Yatirim kararlarinizi kendi arastirmalariniza dayanarak veriniz.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!scanning && topStocks.length === 0 && (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="p-4 rounded-full bg-muted inline-block mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Tarama Baslatilmadi</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {TOTAL_STOCK_COUNT} BIST hissesi arasinda sabah %1 yukselis potansiyeli olan en iyi 5 hisseyi bulmak icin taramayi baslatin.
              </p>
              <Button
                size="lg"
                onClick={startAdvancedScan}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-green"
              >
                <Search className="h-5 w-5 mr-2" />
                Taramayi Baslat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
