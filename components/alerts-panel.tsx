"use client";

import { Bell, Check, Trash2, Info, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTradingStore } from "@/lib/store";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export function AlertsPanel() {
  const { alerts, markAlertAsRead, clearAlerts } = useTradingStore();

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "hedef_ulasildi":
      case "basari":
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case "alim_sinyali":
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case "satim_sinyali":
        return <TrendingDown className="h-4 w-4 text-chart-4" />;
      case "hata":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "bilgi":
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "hedef_ulasildi":
      case "basari":
        return "bg-primary/10 border-primary/30";
      case "alim_sinyali":
        return "bg-primary/10 border-primary/30";
      case "satim_sinyali":
        return "bg-chart-4/10 border-chart-4/30";
      case "hata":
        return "bg-destructive/10 border-destructive/30";
      case "bilgi":
      default:
        return "bg-muted/50 border-border";
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bell className="h-5 w-5 text-primary" />
            Bildirimler
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>
            )}
          </CardTitle>
          {alerts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAlerts} className="text-muted-foreground hover:text-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Temizle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Henuz bildirim yok</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-all ${getAlertColor(
                    alert.type
                  )} ${!alert.isRead ? "ring-2 ring-primary/30" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs border-border text-foreground">
                          {alert.symbol}
                        </Badge>
                        {!alert.isRead && (
                          <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.createdAt), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                        onClick={() => markAlertAsRead(alert.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
