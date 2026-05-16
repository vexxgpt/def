import { EliteScanner } from "@/components/elite-scanner";
import { MarketStatus } from "@/components/market-status";
import { StockList } from "@/components/stock-list";
import { PositionTracker } from "@/components/position-tracker";
import { Watchlist } from "@/components/watchlist";
import { AlertsPanel } from "@/components/alerts-panel";
import { StockDetail } from "@/components/stock-detail";
import { Target, TrendingUp, Zap, Shield, Crown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-primary/20 rounded-xl glow-green-sm">
                <Crown className="h-7 w-7 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  BIST Elite Trader
                </h1>
                <p className="text-sm text-muted-foreground">
                  610 Hisse - Kurumsal Seviye Analiz Sistemi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">Sifir Hata Toleransi</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">35+ Indikator</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Min Guven:</span>
                <span className="font-semibold text-primary">%85</span>
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Target className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-500">TOP 5</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Piyasa Durumu */}
        <MarketStatus />

        {/* Main Tabs */}
        <Tabs defaultValue="elite-scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-lg bg-muted/50 border border-border">
            <TabsTrigger 
              value="elite-scanner"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-primary data-[state=active]:text-primary-foreground"
            >
              <Crown className="h-4 w-4 mr-2" />
              Elite Tarayici
            </TabsTrigger>
            <TabsTrigger 
              value="market"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Piyasa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="elite-scanner" className="mt-6">
            <EliteScanner />
          </TabsContent>

          <TabsContent value="market" className="mt-6">
            {/* Ana Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Sol Kolon - Hisse Listesi */}
              <div className="xl:col-span-2 space-y-6">
                <StockList />
                <PositionTracker />
              </div>

              {/* Sag Kolon - Detay & Izleme */}
              <div className="space-y-6">
                <StockDetail />
                <Watchlist />
                <AlertsPanel />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-6 border-t border-border">
          <p>
            BIST Elite Trader &copy; 2024 - Kurumsal Seviye Analiz Platformu
          </p>
          <p className="mt-1">
            Veriler Yahoo Finance&apos;ten alinmaktadir. 35+ teknik indikator, %85 minimum guven esigi, TOP 5 ultra-elite filtreleme.
          </p>
        </footer>
      </main>
    </div>
  );
}
