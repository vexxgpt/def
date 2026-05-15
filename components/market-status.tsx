"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
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
      console.error("Piyasa durumu alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-muted/50">
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
  const isSellTime = status.message.includes("SATIŞ TAKİP");

  return (
    <Card
      className={`border-2 transition-all ${
        status.isOpen
          ? isBuyTime
            ? "border-green-500 bg-green-500/10"
            : isSellTime
            ? "border-orange-500 bg-orange-500/10"
            : "border-emerald-500/50 bg-emerald-500/5"
          : "border-muted bg-muted/30"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                status.isOpen
                  ? isBuyTime
                    ? "bg-green-500 text-white"
                    : isSellTime
                    ? "bg-orange-500 text-white"
                    : "bg-emerald-500 text-white"
                  : "bg-muted-foreground/20 text-muted-foreground"
              }`}
            >
              {status.isOpen ? (
                isBuyTime ? (
                  <TrendingUp className="h-5 w-5" />
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
                <span className="font-semibold text-lg">{status.message}</span>
                <Badge
                  variant={status.isOpen ? "default" : "secondary"}
                  className={
                    status.isOpen
                      ? isBuyTime
                        ? "bg-green-500"
                        : isSellTime
                        ? "bg-orange-500"
                        : "bg-emerald-500"
                      : ""
                  }
                >
                  {status.isOpen ? "AÇIK" : "KAPALI"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {status.currentDate} • {status.currentTime}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">{status.nextEvent}</p>
            <p className="text-lg font-bold text-primary">{status.timeUntil}</p>
          </div>
        </div>

        {/* Trading Stratejisi Bilgisi */}
        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Alım:</span>
            <span className="font-medium">{status.tradingStrategy.buyTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            <span className="text-muted-foreground">Satış:</span>
            <span className="font-medium">{status.tradingStrategy.sellCondition}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
