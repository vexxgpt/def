"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketStatusData {
  isOpen: boolean;
  message: string;
  nextEvent: string;
  timeUntil: string;
  currentTime: string;
  currentDate: string;
  tradingStrategy: {
    buyTime: string;
    sellCondition: string;
  };
}

export function MarketStatus() {
  const [status, setStatus] = useState<MarketStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/market-status");
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error("Piyasa durumu alinamadi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const isBuyTime = status.message.includes("ALIM ZAMANI");
  const isSellTime = status.message.includes("SATIS TAKIP");

  return (
    <Card
      className={`border-2 transition-all ${
        status.isOpen
          ? isBuyTime
            ? "border-primary bg-primary/10 glow-green-sm"
            : isSellTime
            ? "border-chart-4 bg-chart-4/10"
            : "border-primary/50 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                status.isOpen
                  ? isBuyTime
                    ? "bg-primary text-primary-foreground glow-green-sm"
                    : isSellTime
                    ? "bg-chart-4 text-background"
                    : "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {status.isOpen ? (
                isBuyTime ? (
                  <Zap className="h-5 w-5" />
                ) : isSellTime ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg text-foreground">{status.message}</span>
                <Badge
                  className={
                    status.isOpen
                      ? isBuyTime
                        ? "bg-primary text-primary-foreground"
                        : isSellTime
                        ? "bg-chart-4 text-background"
                        : "bg-primary/20 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {status.isOpen ? "ACIK" : "KAPALI"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {status.currentDate} - {status.currentTime}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{status.nextEvent}</p>
            <p className="text-xl font-bold text-primary font-mono">{status.timeUntil}</p>
          </div>
        </div>

        {/* Trading Stratejisi Bilgisi */}
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Alim:</span>
            <span className="font-medium text-foreground">{status.tradingStrategy.buyTime}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-chart-4/5 border border-chart-4/20">
            <TrendingDown className="h-4 w-4 text-chart-4" />
            <span className="text-muted-foreground">Satis:</span>
            <span className="font-medium text-foreground">{status.tradingStrategy.sellCondition}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
