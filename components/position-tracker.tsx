"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTradingStore } from "@/lib/store";
import type { Position } from "@/lib/types";

export function PositionTracker() {
  const { positions, addPosition, closePosition, deletePosition, addAlert } =
    useTradingStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [sellPrice, setSellPrice] = useState("");

  const [newPosition, setNewPosition] = useState({
    symbol: "",
    buyPrice: "",
    quantity: "",
  });

  const handleAddPosition = () => {
    if (!newPosition.symbol || !newPosition.buyPrice || !newPosition.quantity) {
      return;
    }

    const buyPrice = parseFloat(newPosition.buyPrice);
    const quantity = parseInt(newPosition.quantity);
    const targetPrice = buyPrice * 1.01; // %1 hedef

    addPosition({
      symbol: newPosition.symbol.toUpperCase(),
      buyPrice,
      buyDate: new Date(),
      quantity,
      targetPrice,
      status: "acik",
    });

    addAlert({
      symbol: newPosition.symbol.toUpperCase(),
      type: "bilgi",
      message: `Yeni pozisyon açıldı: ${quantity} adet x ${buyPrice.toFixed(2)} ₺ = ${(quantity * buyPrice).toFixed(2)} ₺`,
    });

    setNewPosition({ symbol: "", buyPrice: "", quantity: "" });
    setIsAddDialogOpen(false);
  };

  const handleSellPosition = () => {
    if (!selectedPosition || !sellPrice) return;

    const price = parseFloat(sellPrice);
    closePosition(selectedPosition.id, price);

    const profit = (price - selectedPosition.buyPrice) * selectedPosition.quantity;
    const profitPercent =
      ((price - selectedPosition.buyPrice) / selectedPosition.buyPrice) * 100;

    addAlert({
      symbol: selectedPosition.symbol,
      type: profit >= 0 ? "satim_sinyali" : "bilgi",
      message: `Pozisyon kapatildi: ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} TL (${profitPercent >= 0 ? "+" : ""}${profitPercent.toFixed(2)}%)`,
    });

    setSellPrice("");
    setSelectedPosition(null);
    setIsSellDialogOpen(false);
  };

  const openPositions = positions.filter((p) => p.status === "acik");
  const closedPositions = positions.filter((p) => p.status === "satildi");

  const totalOpenValue = openPositions.reduce(
    (sum, p) => sum + p.buyPrice * p.quantity,
    0
  );
  const totalProfit = closedPositions.reduce((sum, p) => sum + (p.profit || 0), 0);
  const winRate =
    closedPositions.length > 0
      ? (closedPositions.filter((p) => (p.profit || 0) > 0).length /
          closedPositions.length) *
        100
      : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Pozisyonlarım
          </CardTitle>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Pozisyon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Pozisyon Ekle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Hisse Kodu</Label>
                  <Input
                    id="symbol"
                    placeholder="Örn: THYAO"
                    value={newPosition.symbol}
                    onChange={(e) =>
                      setNewPosition({ ...newPosition, symbol: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyPrice">Alış Fiyatı (₺)</Label>
                  <Input
                    id="buyPrice"
                    type="number"
                    step="0.01"
                    placeholder="Örn: 245.50"
                    value={newPosition.buyPrice}
                    onChange={(e) =>
                      setNewPosition({ ...newPosition, buyPrice: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Adet</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Örn: 100"
                    value={newPosition.quantity}
                    onChange={(e) =>
                      setNewPosition({ ...newPosition, quantity: e.target.value })
                    }
                  />
                </div>
                {newPosition.buyPrice && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Hedef Fiyat (%1):{" "}
                      <span className="font-semibold text-emerald-600">
                        {(parseFloat(newPosition.buyPrice) * 1.01).toFixed(2)} ₺
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleAddPosition}>Ekle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Özet Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Açık Pozisyon</span>
            </div>
            <p className="text-xl font-bold">{openPositions.length}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Toplam Değer</span>
            </div>
            <p className="text-xl font-bold">
              {totalOpenValue.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}{" "}
              ₺
            </p>
          </div>
          <div
            className={`p-3 rounded-lg border ${
              totalProfit >= 0
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <div
              className={`flex items-center gap-2 mb-1 ${
                totalProfit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-xs">Toplam Kar/Zarar</span>
            </div>
            <p className="text-xl font-bold">
              {totalProfit >= 0 ? "+" : ""}
              {totalProfit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Başarı Oranı</span>
            </div>
            <p className="text-xl font-bold">{winRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Pozisyon Tablosu */}
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Henüz pozisyon yok</p>
            <p className="text-sm">Yeni pozisyon ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hisse</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Alış</TableHead>
                  <TableHead className="text-right">Hedef (%1)</TableHead>
                  <TableHead className="text-right">Adet</TableHead>
                  <TableHead className="text-right">Kar/Zarar</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <div>
                        <span className="font-semibold">{position.symbol}</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(position.buyDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={position.status === "acik" ? "default" : "secondary"}
                        className={
                          position.status === "acik" ? "bg-blue-500" : ""
                        }
                      >
                        {position.status === "acik" ? "Acik" : "Satildi"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {position.buyPrice.toFixed(2)} ₺
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      {position.targetPrice.toFixed(2)} ₺
                    </TableCell>
                    <TableCell className="text-right">{position.quantity}</TableCell>
                    <TableCell className="text-right">
                      {position.status === "satildi" && position.profit !== undefined ? (
                        <span
                          className={`font-medium ${
                            position.profit >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {position.profit >= 0 ? "+" : ""}
                          {position.profit.toFixed(2)} ₺
                          <br />
                          <span className="text-xs">
                            ({position.profitPercent?.toFixed(2)}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {position.status === "acik" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPosition(position);
                              setSellPrice(position.targetPrice.toFixed(2));
                              setIsSellDialogOpen(true);
                            }}
                          >
                            Sat
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Pozisyonu Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                {position.symbol} pozisyonunu silmek istediğinize emin
                                misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePosition(position.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Satış Dialog */}
        <Dialog open={isSellDialogOpen} onOpenChange={setIsSellDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pozisyon Sat - {selectedPosition?.symbol}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Alış Fiyatı:</span>
                  <span className="font-medium">
                    {selectedPosition?.buyPrice.toFixed(2)} ₺
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hedef Fiyat (%1):</span>
                  <span className="font-medium text-emerald-600">
                    {selectedPosition?.targetPrice.toFixed(2)} ₺
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Adet:</span>
                  <span className="font-medium">{selectedPosition?.quantity}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellPrice">Satış Fiyatı (₺)</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
              </div>

              {sellPrice && selectedPosition && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tahmini Kar/Zarar:</span>
                    <span
                      className={`font-bold ${
                        parseFloat(sellPrice) >= selectedPosition.buyPrice
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {(
                        (parseFloat(sellPrice) - selectedPosition.buyPrice) *
                        selectedPosition.quantity
                      ).toFixed(2)}{" "}
                      ₺
                    </span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSellDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSellPosition} className="bg-emerald-600 hover:bg-emerald-700">
                Sat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
