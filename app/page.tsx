import { ProScanner } from "@/components/pro-scanner";
import { MarketStatus } from "@/components/market-status";
import { StockList } from "@/components/stock-list";
import { PositionTracker } from "@/components/position-tracker";
import { Watchlist } from "@/components/watchlist";
import { AlertsPanel } from "@/components/alerts-panel";
import { StockDetail } from "@/components/stock-detail";
import { Target, TrendingUp, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/20 rounded-xl glow-green-sm">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">BIST Tarayici</h1>
                <p className="text-sm text-muted-foreground">
                  610 Hisse Analizi - %1 Yukselis Hedefli Strateji
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Kapanista Al - Sabah Sat</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Hedef:</span>
                <span className="font-semibold text-primary">%1</span>
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
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 border border-border">
            <TabsTrigger 
              value="scanner"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Target className="h-4 w-4 mr-2" />
              Gelismis Tarayici
            </TabsTrigger>
            <TabsTrigger 
              value="market"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Piyasa Goruntule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="mt-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3">
                <ProScanner />
              </div>
              <div className="space-y-6">
                <AlertsPanel />
                <Watchlist />
              </div>
            </div>
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
            BIST Tarayici &copy; 2024 - Bu platform yatirim tavsiyesi vermez.
          </p>
          <p className="mt-1">
            Veriler Yahoo Finance&apos;ten alinmaktadir. Tum yatirim kararlari size aittir.
          </p>
        </footer>
      </main>
    </div>
  );
}
