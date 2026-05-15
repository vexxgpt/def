import { MarketStatus } from "@/components/market-status";
import { StockList } from "@/components/stock-list";
import { PositionTracker } from "@/components/position-tracker";
import { Watchlist } from "@/components/watchlist";
import { AlertsPanel } from "@/components/alerts-panel";
import { StockDetail } from "@/components/stock-detail";
import { BarChart3, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">BIST Trader</h1>
                <p className="text-xs text-muted-foreground">
                  Borsa İstanbul Trading Sistemi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>%1 Hedef Stratejisi</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Piyasa Durumu */}
        <MarketStatus />

        {/* Ana Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sol Kolon - Hisse Listesi */}
          <div className="xl:col-span-2 space-y-6">
            <StockList />
            <PositionTracker />
          </div>

          {/* Sağ Kolon - Detay & İzleme */}
          <div className="space-y-6">
            <StockDetail />
            <Watchlist />
            <AlertsPanel />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-6 border-t">
          <p>
            BIST Trader &copy; 2024 • Bu platform yatırım tavsiyesi vermez.
          </p>
          <p className="mt-1">
            Veriler 15 dakika gecikmeli olarak Yahoo Finance&apos;ten alınmaktadır.
          </p>
        </footer>
      </main>
    </div>
  );
}
