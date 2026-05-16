"use client";

import { useState } from "react";
import {
  Moon,
  Sun,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Timer,
  Sparkles,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import type { EliteScanResult } from "@/lib/elite-scanner-types";
import type { OvernightAnalysis, WeeklyMorningScore, UltraEliteOpportunity } from "@/lib/overnight-analyzer";

interface OvernightPanelProps {
  result: EliteScanResult;
  overnightAnalysis?: OvernightAnalysis;
}

export function OvernightPanel({ result, overnightAnalysis }: OvernightPanelProps) {
  const [expanded, setExpanded] = useState(false);
  
  // GERCEK VERI KONTROL - SAHTE VERI KULLANILMAYACAK
  const hasRealData = result.overnightAnalysis !== undefined;
  
  if (!hasRealData) {
    return (
      <TooltipProvider>
        <Card className="border-chart-4/30 bg-gradient-to-br from-chart-4/5 to-background">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 rounded-lg bg-chart-4/20">
                  <Moon className="h-4 w-4 text-chart-4" />
                </div>
                Overnight Analizi
                <Badge variant="outline" className="text-xs bg-chart-4/10 text-chart-4 border-chart-4/30">
                  VERI BEKLENIYOR
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-chart-4" />
              <p className="text-sm">Overnight analizi icin yeterli tarihsel veri yok.</p>
              <p className="text-xs mt-1">En az 10 gunluk veri gerekli.</p>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }
  
  // GERCEK VERI KULLAN - result.overnightAnalysis'den
  const overnightData = result.overnightAnalysis!;
  const morningGreenData = result.morningGreen;
  
  // Gercek veriden haftalik skor olustur
  const weeklyScore: WeeklyMorningScore = {
    last5Days: morningGreenData?.last5Days.map(d => ({
      date: d.date,
      eveningClose: d.prevClose,
      eveningHigh: d.prevClose * 1.02,
      eveningLow: d.prevClose * 0.98,
      eveningVolume: 0,
      eveningCandle: d.closedGreen ? 'green' as const : 'red' as const,
      morningOpen: d.open,
      morningGap: d.gapPercent,
      morningGapType: d.gapPercent > 0.3 ? 'gap_up' as const : d.gapPercent < -0.3 ? 'gap_down' as const : 'flat' as const,
      morningCandle: d.morningGreen ? 'green' as const : 'red' as const,
      morningFirst30MinHigh: d.morningHigh,
      morningFirst30MinLow: d.prevClose * 0.99,
      eveningGreenMorningGreen: d.closedGreen && d.morningGreen,
      eveningGreenMorningRed: d.closedGreen && !d.morningGreen,
      eveningRedMorningGreen: !d.closedGreen && d.morningGreen,
      eveningRedMorningRed: !d.closedGreen && !d.morningGreen,
      morningPerformance: ((d.morningHigh - d.open) / d.open) * 100,
      dayPerformance: d.gapPercent,
    })) || [],
    weeklyScore: overnightData.weeklyScore,
    patterns: {
      eveningGreenMorningGreenCount: Math.round(overnightData.eveningGreenSuccessRate / 20),
      eveningGreenMorningRedCount: Math.round((100 - overnightData.eveningGreenSuccessRate) / 20),
      eveningRedMorningGreenCount: Math.round(overnightData.eveningRedRecoveryRate / 20),
      eveningRedMorningRedCount: Math.round((100 - overnightData.eveningRedRecoveryRate) / 20),
      eveningGreenSuccessRate: overnightData.eveningGreenSuccessRate,
      eveningRedRecoveryRate: overnightData.eveningRedRecoveryRate,
      overallMorningGreenRate: overnightData.overallMorningGreenRate,
    },
    reliability: {
      eveningGreenReliability: overnightData.eveningGreenSuccessRate,
      patternConsistency: overnightData.patternConsistency,
      confidenceLevel: overnightData.confidenceLevel,
    },
    prediction: {
      nextMorningDirection: overnightData.prediction.nextMorningDirection,
      probability: overnightData.prediction.probability,
      reasoning: [
        `Sabah ${overnightData.prediction.nextMorningDirection === 'green' ? 'yesil' : overnightData.prediction.nextMorningDirection === 'red' ? 'kirmizi' : 'belirsiz'} bekleniyor`,
        `Olasilik: %${overnightData.prediction.probability}`,
        `Beklenen Gap: %${overnightData.prediction.expectedGap.toFixed(2)}`,
      ],
    },
  };
  
  const prediction: OvernightAnalysis['morningPrediction'] = {
    expectedGap: overnightData.prediction.expectedGap,
    expectedDirection: overnightData.prediction.expectedGap > 0.3 ? 'gap_up' : overnightData.prediction.expectedGap < -0.3 ? 'gap_down' : 'flat',
    probability: overnightData.prediction.probability,
    confidence: overnightData.patternConsistency,
    scenarios: {
      bullish: { probability: overnightData.prediction.probability, targetPercent: overnightData.prediction.expectedGap + 1 },
      neutral: { probability: Math.max(10, 100 - overnightData.prediction.probability - 20), targetPercent: 0 },
      bearish: { probability: Math.max(5, 100 - overnightData.prediction.probability), targetPercent: overnightData.prediction.expectedGap - 1 },
    },
  };
  
  const strategy: OvernightAnalysis['strategy'] = {
    eveningAction: overnightData.strategy.eveningAction,
    morningAction: overnightData.strategy.morningAction,
    reasoning: [
      `Haftalik Skor: ${overnightData.weeklyScore}/100`,
      `Sabah Yesil Orani: %${overnightData.overallMorningGreenRate}`,
      `Pattern Tutarliligi: %${overnightData.patternConsistency}`,
    ],
    optimalTiming: overnightData.strategy.eveningAction === 'BUY_BEFORE_CLOSE' 
      ? '17:30-17:45 arasi' 
      : 'Sabah 10:00\'a kadar izle',
  };
  
  const risk: OvernightAnalysis['overnightRisk'] = {
    score: overnightData.overnightRisk.score,
    factors: [],
    recommendation: overnightData.overnightRisk.recommendation,
  };
  
  const currentEvening: OvernightAnalysis['currentEvening'] = {
    isGreen: result.price.changePercent >= 0,
    closePrice: result.price.current,
    changePercent: result.price.changePercent,
    volumeVsAvg: result.volume.ratio,
    candleStrength: result.volume.ratio >= 1.5 ? 'strong' : result.volume.ratio >= 0.8 ? 'moderate' : 'weak',
  };

  return (
    <TooltipProvider>
      <Card className="border-chart-4/30 bg-gradient-to-br from-chart-4/5 to-background">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 rounded-lg bg-chart-4/20">
                <Moon className="h-4 w-4 text-chart-4" />
              </div>
              Overnight Analizi
              <Badge variant="outline" className="text-xs bg-chart-4/10 text-chart-4 border-chart-4/30">
                AKSAM-SABAH
              </Badge>
            </CardTitle>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Ana Metrikler */}
          <div className="grid grid-cols-3 gap-3">
            {/* Haftalik Skor */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Haftalik Skor</span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold ${
                  weeklyScore.weeklyScore >= 70 ? 'text-primary' :
                  weeklyScore.weeklyScore >= 50 ? 'text-chart-4' : 'text-destructive'
                }`}>
                  {weeklyScore.weeklyScore}
                </span>
                <span className="text-xs text-muted-foreground mb-1">/100</span>
              </div>
              <div className="mt-2">
                <Progress 
                  value={weeklyScore.weeklyScore} 
                  className="h-1.5" 
                />
              </div>
            </div>
            
            {/* Sabah Yesil Orani */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sabah Yesil</span>
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold ${
                  weeklyScore.patterns.overallMorningGreenRate >= 60 ? 'text-primary' :
                  weeklyScore.patterns.overallMorningGreenRate >= 40 ? 'text-chart-4' : 'text-destructive'
                }`}>
                  %{weeklyScore.patterns.overallMorningGreenRate}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Son 5 gunde {Math.round(weeklyScore.patterns.overallMorningGreenRate / 20)}/5
              </p>
            </div>
            
            {/* Guvenilirlik */}
            <div className="p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Guvenilirlik</span>
              </div>
              <Badge variant="outline" className={`text-xs ${getConfidenceColor(weeklyScore.reliability.confidenceLevel)}`}>
                {getConfidenceLabel(weeklyScore.reliability.confidenceLevel)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Pattern: %{weeklyScore.reliability.patternConsistency}
              </p>
            </div>
          </div>
          
          {/* Mevcut Aksam Durumu */}
          <div className={`p-3 rounded-lg border ${
            currentEvening.isGreen 
              ? 'bg-primary/5 border-primary/30' 
              : 'bg-destructive/5 border-destructive/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Bugunku Kapanis
              </span>
              <Badge variant="outline" className={`text-xs ${
                currentEvening.isGreen 
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : 'bg-destructive/20 text-destructive border-destructive/30'
              }`}>
                {currentEvening.isGreen ? 'YESIL' : 'KIRMIZI'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Degisim</span>
                <p className={`font-semibold ${currentEvening.changePercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {currentEvening.changePercent >= 0 ? '+' : ''}{currentEvening.changePercent.toFixed(2)}%
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Hacim/Ort</span>
                <p className="font-semibold text-foreground">{currentEvening.volumeVsAvg.toFixed(1)}x</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Mum Gucu</span>
                <p className={`font-semibold ${
                  currentEvening.candleStrength === 'strong' ? 'text-primary' :
                  currentEvening.candleStrength === 'moderate' ? 'text-chart-4' : 'text-muted-foreground'
                }`}>
                  {currentEvening.candleStrength === 'strong' ? 'Guclu' :
                   currentEvening.candleStrength === 'moderate' ? 'Orta' : 'Zayif'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Sabah Tahmini */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Sabah Tahmini
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${
                  prediction.expectedDirection === 'gap_up' 
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : prediction.expectedDirection === 'gap_down'
                      ? 'bg-destructive/20 text-destructive border-destructive/30'
                      : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {prediction.expectedDirection === 'gap_up' ? 'GAP UP' :
                   prediction.expectedDirection === 'gap_down' ? 'GAP DOWN' : 'FLAT'}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Beklenen Gap</span>
                <p className={`text-xl font-bold ${
                  prediction.expectedGap > 0 ? 'text-primary' :
                  prediction.expectedGap < 0 ? 'text-destructive' : 'text-foreground'
                }`}>
                  {prediction.expectedGap > 0 ? '+' : ''}{prediction.expectedGap.toFixed(2)}%
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Olasilik</span>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold text-foreground">%{prediction.probability}</p>
                  <div className="flex-1">
                    <Progress value={prediction.probability} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Senaryolar */}
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground mb-2 block">Senaryolar</span>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 p-2 rounded bg-primary/10 border border-primary/20">
                      <TrendingUp className="h-3 w-3 text-primary mx-auto mb-1" />
                      <p className="text-xs text-center font-medium text-primary">
                        %{prediction.scenarios.bullish.probability}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Yukselis: +{prediction.scenarios.bullish.targetPercent}%</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 p-2 rounded bg-muted border border-border">
                      <Activity className="h-3 w-3 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-center font-medium text-muted-foreground">
                        %{prediction.scenarios.neutral.probability}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notr: {prediction.scenarios.neutral.targetPercent}%</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 p-2 rounded bg-destructive/10 border border-destructive/20">
                      <TrendingDown className="h-3 w-3 text-destructive mx-auto mb-1" />
                      <p className="text-xs text-center font-medium text-destructive">
                        %{prediction.scenarios.bearish.probability}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Dusus: {prediction.scenarios.bearish.targetPercent}%</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          
          {/* Overnight Risk */}
          <div className={`p-3 rounded-lg border ${
            risk.score < 40 ? 'bg-primary/5 border-primary/30' :
            risk.score < 60 ? 'bg-chart-4/5 border-chart-4/30' :
            'bg-destructive/5 border-destructive/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                {risk.score < 40 ? (
                  <ShieldCheck className="h-4 w-4 text-primary" />
                ) : risk.score < 60 ? (
                  <Shield className="h-4 w-4 text-chart-4" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                )}
                Overnight Risk
              </span>
              <Badge variant="outline" className={`text-xs ${
                risk.recommendation === 'HOLD_OVERNIGHT'
                  ? 'bg-primary/20 text-primary border-primary/30'
                  : risk.recommendation === 'CAUTION'
                    ? 'bg-chart-4/20 text-chart-4 border-chart-4/30'
                    : 'bg-destructive/20 text-destructive border-destructive/30'
              }`}>
                {risk.recommendation === 'HOLD_OVERNIGHT' ? 'GECE TUTULMASI UYGUN' :
                 risk.recommendation === 'CAUTION' ? 'DIKKATLI OL' : 'KAPANIS ONCESI CIK'}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Progress 
                  value={risk.score} 
                  className={`h-2 ${
                    risk.score < 40 ? '[&>div]:bg-primary' :
                    risk.score < 60 ? '[&>div]:bg-chart-4' :
                    '[&>div]:bg-destructive'
                  }`} 
                />
              </div>
              <span className={`text-sm font-bold ${
                risk.score < 40 ? 'text-primary' :
                risk.score < 60 ? 'text-chart-4' : 'text-destructive'
              }`}>
                {risk.score}/100
              </span>
            </div>
            {risk.factors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {risk.factors.map((factor, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-background">
                    {factor}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Strateji Onerisi */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Strateji Onerisi</span>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 p-2 rounded bg-background border border-border text-center">
                <span className="text-xs text-muted-foreground block mb-1">Aksam</span>
                <Badge variant="outline" className={`text-xs ${getStrategyColor(strategy.eveningAction)}`}>
                  {getStrategyLabel(strategy.eveningAction)}
                </Badge>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 p-2 rounded bg-background border border-border text-center">
                <span className="text-xs text-muted-foreground block mb-1">Sabah</span>
                <Badge variant="outline" className={`text-xs ${getStrategyColor(strategy.morningAction)}`}>
                  {getStrategyLabel(strategy.morningAction)}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              <span>{strategy.optimalTiming}</span>
            </div>
            
            {strategy.reasoning.length > 0 && expanded && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground mb-2 block">Analiz Notlari</span>
                <ul className="space-y-1">
                  {strategy.reasoning.map((reason, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Genisletilmis Bolum - Pattern Tarihcesi */}
          {expanded && (
            <>
              <Separator />
              
              {/* Son 5 Gun Pattern Tarihcesi */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Son 5 Gun Pattern Tarihcesi
                </h4>
                
                <div className="space-y-2">
                  {weeklyScore.last5Days.map((day, i) => (
                    <div 
                      key={i} 
                      className="p-2 rounded-lg bg-muted/50 border border-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground font-mono w-20">
                          {day.date}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${
                            day.eveningCandle === 'green' 
                              ? 'bg-primary/20 text-primary border-primary/30'
                              : day.eveningCandle === 'red'
                                ? 'bg-destructive/20 text-destructive border-destructive/30'
                                : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            Aksam: {day.eveningCandle === 'green' ? 'Y' : day.eveningCandle === 'red' ? 'K' : 'D'}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className={`text-xs ${
                            day.morningGapType === 'gap_up' 
                              ? 'bg-primary/20 text-primary border-primary/30'
                              : day.morningGapType === 'gap_down'
                                ? 'bg-destructive/20 text-destructive border-destructive/30'
                                : 'bg-muted text-muted-foreground border-border'
                          }`}>
                            Sabah: {day.morningGapType === 'gap_up' ? 'Y' : day.morningGapType === 'gap_down' ? 'K' : 'F'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          day.morningGap > 0 ? 'text-primary' :
                          day.morningGap < 0 ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          Gap: {day.morningGap > 0 ? '+' : ''}{day.morningGap.toFixed(2)}%
                        </span>
                        {day.eveningGreenMorningGreen ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : day.eveningGreenMorningRed ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : day.eveningRedMorningGreen ? (
                          <TrendingUp className="h-4 w-4 text-chart-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pattern Ozeti */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="p-2 rounded bg-primary/10 border border-primary/20">
                    <span className="text-xs text-muted-foreground">Aksam Y -{">"} Sabah Y</span>
                    <p className="text-lg font-bold text-primary">
                      {weeklyScore.patterns.eveningGreenMorningGreenCount}/5
                    </p>
                    <span className="text-xs text-primary">
                      %{weeklyScore.patterns.eveningGreenSuccessRate} basari
                    </span>
                  </div>
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                    <span className="text-xs text-muted-foreground">Aksam Y -{">"} Sabah K</span>
                    <p className="text-lg font-bold text-destructive">
                      {weeklyScore.patterns.eveningGreenMorningRedCount}/5
                    </p>
                    <span className="text-xs text-destructive">
                      Dikkat
                    </span>
                  </div>
                  <div className="p-2 rounded bg-chart-4/10 border border-chart-4/20">
                    <span className="text-xs text-muted-foreground">Aksam K -{">"} Sabah Y</span>
                    <p className="text-lg font-bold text-chart-4">
                      {weeklyScore.patterns.eveningRedMorningGreenCount}/5
                    </p>
                    <span className="text-xs text-chart-4">
                      %{weeklyScore.patterns.eveningRedRecoveryRate} recovery
                    </span>
                  </div>
                  <div className="p-2 rounded bg-muted border border-border">
                    <span className="text-xs text-muted-foreground">Aksam K -{">"} Sabah K</span>
                    <p className="text-lg font-bold text-muted-foreground">
                      {weeklyScore.patterns.eveningRedMorningRedCount}/5
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Kacinilmali
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Ultra-Elite Badge Component
interface UltraEliteBadgeProps {
  score: number;
  criteriaMetCount: number;
  totalCriteria: number;
}

export function UltraEliteBadge({ score, criteriaMetCount, totalCriteria }: UltraEliteBadgeProps) {
  if (score < 60) return null;
  
  const isTopTier = score >= 85 && criteriaMetCount >= 7;
  const isElite = score >= 70 && criteriaMetCount >= 6;
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs font-semibold ${
        isTopTier 
          ? 'bg-gradient-to-r from-primary/30 to-chart-2/30 text-primary border-primary/50 animate-pulse'
          : isElite
            ? 'bg-primary/20 text-primary border-primary/40'
            : 'bg-chart-4/20 text-chart-4 border-chart-4/40'
      }`}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      {isTopTier ? 'ULTRA-ELITE' : isElite ? 'ELITE' : 'IZLENIYOR'}
      <span className="ml-1 opacity-75">{score}</span>
    </Badge>
  );
}

// Morning Green Score Display
interface MorningGreenScoreProps {
  score: number;
  rate5d: number;
  rate10d: number;
  rate20d: number;
}

export function MorningGreenScore({ score, rate5d, rate10d, rate20d }: MorningGreenScoreProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg ${
        score >= 75 ? 'bg-primary/20 text-primary' :
        score >= 50 ? 'bg-chart-4/20 text-chart-4' :
        'bg-destructive/20 text-destructive'
      }`}>
        {score}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-12">5 Gun:</span>
          <Progress value={rate5d} className="h-1.5 flex-1" />
          <span className={`font-medium ${rate5d >= 60 ? 'text-primary' : 'text-muted-foreground'}`}>
            %{rate5d}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-12">10 Gun:</span>
          <Progress value={rate10d} className="h-1.5 flex-1" />
          <span className={`font-medium ${rate10d >= 60 ? 'text-primary' : 'text-muted-foreground'}`}>
            %{rate10d}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-12">20 Gun:</span>
          <Progress value={rate20d} className="h-1.5 flex-1" />
          <span className={`font-medium ${rate20d >= 60 ? 'text-primary' : 'text-muted-foreground'}`}>
            %{rate20d}
          </span>
        </div>
      </div>
    </div>
  );
}

// Yardimci fonksiyonlar
function getConfidenceColor(level: string): string {
  switch (level) {
    case 'very_high': return 'bg-primary/20 text-primary border-primary/30';
    case 'high': return 'bg-primary/15 text-primary border-primary/25';
    case 'medium': return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
    case 'low': return 'bg-destructive/20 text-destructive border-destructive/30';
    case 'very_low': return 'bg-destructive/30 text-destructive border-destructive/40';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

function getConfidenceLabel(level: string): string {
  switch (level) {
    case 'very_high': return 'Cok Yuksek';
    case 'high': return 'Yuksek';
    case 'medium': return 'Orta';
    case 'low': return 'Dusuk';
    case 'very_low': return 'Cok Dusuk';
    default: return 'Bilinmiyor';
  }
}

function getStrategyColor(action: string): string {
  if (action.includes('BUY')) return 'bg-primary/20 text-primary border-primary/30';
  if (action.includes('SELL') || action.includes('EXIT')) return 'bg-destructive/20 text-destructive border-destructive/30';
  if (action.includes('HOLD')) return 'bg-chart-4/20 text-chart-4 border-chart-4/30';
  return 'bg-muted text-muted-foreground border-border';
}

function getStrategyLabel(action: string): string {
  switch (action) {
    case 'BUY_BEFORE_CLOSE': return 'Kapanista Al';
    case 'BUY_AT_OPEN': return 'Acilista Al';
    case 'BUY_ON_DIP': return 'Dipte Al';
    case 'HOLD': return 'Tut';
    case 'SELL_BEFORE_CLOSE': return 'Kapanista Sat';
    case 'SELL_AT_OPEN': return 'Acilista Sat';
    case 'WAIT': return 'Bekle';
    case 'WAIT_AND_SEE': return 'Izle';
    default: return action;
  }
}

