"use client";

import { Bell, Check, Trash2, Info, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
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
      case "hedef_ulaşıldı":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "alım_sinyali":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "satım_sinyali":
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "hedef_ulaşıldı":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "alım_sinyali":
        return "bg-blue-500/10 border-blue-500/20";
      case "satım_sinyali":
        return "bg-orange-500/10 border-orange-500/20";
      default:
        return "bg-muted/50 border-border";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            Bildirimler
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </CardTitle>
          {alerts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAlerts}>
              <Trash2 className="h-4 w-4 mr-2" />
              Temizle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Henüz bildirim yok</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border transition-all ${getAlertColor(
                    alert.type
                  )} ${!alert.isRead ? "ring-2 ring-primary/20" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {alert.symbol}
                        </Badge>
                        {!alert.isRead && (
                          <span className="h-2 w-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <p className="text-sm">{alert.message}</p>
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
                        className="h-8 w-8 shrink-0"
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
