import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_API_KEY, GROQ_MODEL } from "@/lib/groq-config";

export const dynamic = "force-dynamic";

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// TUM VERILERI ICEREN INTERFACE
interface EliteStockData {
  symbol: string;
  name: string;
  sector?: string;
  price: {
    current: number;
    open?: number;
    high?: number;
    low?: number;
    previousClose?: number;
    change: number;
    changePercent: number;
  };
  volume?: {
    current?: number;
    average?: number;
    ratio?: number;
  };
  score: {
    total: number;
    overall?: number;
    grade?: string;
    technical?: number;
    momentum?: number;
    volume?: number;
    trend?: number;
    risk?: number;
  };
  risk: {
    level: string;
    score: number;
  };
  decision: {
    action: string;
    conviction: number;
    confidence?: number;
    reasoning?: string[];
  };
  // Sabah Yesil Analizi
  morningGreen?: {
    morningGreenScore: number;
    historicalGreenRate?: number;
    stats?: {
      greenMornings5d?: number;
      greenMorningRate5d?: number;
      greenMornings10d?: number;
      greenMorningRate10d?: number;
      avgMorningGap?: number;
      avgMorningMove?: number;
      afternoonReliability?: number;
    };
    patterns?: {
      consecutiveGreenMornings?: number;
      isHotStreak?: boolean;
      hasMomentum?: boolean;
    };
  };
  // Overnight Analizi
  overnightAnalysis?: {
    overallMorningGreenRate?: number;
    weeklyScore?: number;
    prediction?: {
      probability: number;
      expectedGap: number;
      confidence?: number;
    };
    strategy?: {
      eveningAction?: string;
      morningAction?: string;
      reasoning?: string[];
    };
    factors?: {
      trendScore?: number;
      momentumScore?: number;
      volumeScore?: number;
      technicalScore?: number;
      riskScore?: number;
    };
  };
  // Teknik Indikatorler
  indicators?: {
    rsi?: {
      current: number;
      previous?: number;
      divergence?: string;
    };
    macd?: {
      macdLine?: number;
      signalLine?: number;
      histogram: number;
      crossover?: string;
      divergence?: string;
    };
    stochastic?: {
      k?: number;
      d?: number;
      crossover?: string;
    };
    adx?: {
      value: number;
      plusDI?: number;
      minusDI?: number;
      trend?: string;
    };
    atr?: {
      value?: number;
      percent?: number;
    };
    ema?: {
      ema8?: number;
      ema21?: number;
      ema50?: number;
      ema200?: number;
      alignment?: string;
    };
    bollinger?: {
      upper?: number;
      middle?: number;
      lower?: number;
      percentB?: number;
      bandwidth?: number;
      position?: string;
    };
    ichimoku?: {
      tenkan?: number;
      kijun?: number;
      senkouA?: number;
      senkouB?: number;
      chikou?: number;
      cloudColor?: string;
      priceVsCloud?: string;
    };
    obv?: {
      trend?: string;
      divergence?: string;
    };
    vwap?: {
      value?: number;
      deviation?: number;
    };
    dailyTrend?: string;
  };
  // Pro Trader Kriterleri
  proTraderCriteria?: {
    proScore: number;
    proGrade?: string;
    proSignal?: string;
    proReasons?: string[];
    minerviniTemplate?: {
      passed: boolean;
      score: number;
      criteria?: Record<string, boolean>;
    };
    institutionalAccumulation?: {
      signal: string;
      score: number;
      description?: string;
    };
    relativeStrength?: {
      rsRating: number;
      rs3m?: number;
      rs6m?: number;
      marketOutperformance?: boolean;
    };
    smartMoneyFlow?: {
      bigPlayerActivity: string;
      score?: number;
      netFlow?: string;
    };
    volumeProfile?: {
      accumulation?: boolean;
      distribution?: boolean;
      signal?: string;
    };
    breakoutAnalysis?: {
      nearBreakout?: boolean;
      breakoutDistance?: number;
      baseLength?: number;
    };
  };
  // Hedef ve Risk
  target?: {
    conservative?: number;
    moderate?: number;
    aggressive?: number;
    stopLoss?: number;
    riskRewardRatios?: {
      conservative?: number;
      moderate?: number;
      aggressive?: number;
    };
  };
  // Pivot Seviyeleri
  pivots?: {
    r3?: number;
    r2?: number;
    r1?: number;
    pivot?: number;
    s1?: number;
    s2?: number;
    s3?: number;
  };
  // Ultra Elite
  ultraEliteScore?: number;
  isUltraElite?: boolean;
  compositeScore?: number;
  signalStrength?: {
    value?: number;
    label?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stocks } = body as { stocks: EliteStockData[] };

    if (!stocks || stocks.length === 0) {
      return NextResponse.json(
        { error: "Hisse verileri gerekli" },
        { status: 400 }
      );
    }

    // Her hisse icin TUM VERILERI iceren detayli ozet olustur
    const stocksSummary = stocks.map((stock, index) => {
      const proTrader = stock.proTraderCriteria;
      const overnight = stock.overnightAnalysis;
      const morningGreen = stock.morningGreen;
      const indicators = stock.indicators;
      const target = stock.target;
      
      return `
===============================================
${index + 1}. ${stock.symbol} (${stock.name}) - ${stock.sector || 'N/A'}
===============================================

FIYAT VE HACIM:
- Guncel Fiyat: ${stock.price.current.toFixed(2)} TL
- Degisim: ${stock.price.changePercent >= 0 ? '+' : ''}${stock.price.changePercent.toFixed(2)}%
- Gun Ici: Acilis ${stock.price.open?.toFixed(2) || 'N/A'} | Yuksek ${stock.price.high?.toFixed(2) || 'N/A'} | Dusuk ${stock.price.low?.toFixed(2) || 'N/A'}
- Hacim Orani: ${stock.volume?.ratio?.toFixed(2) || 'N/A'}x ortalama

SKORLAR:
- Elite Skor: ${stock.score.total || stock.score.overall || 0}/100
- Grade: ${stock.score.grade || 'N/A'}
- Teknik: ${stock.score.technical || 'N/A'}/100 | Momentum: ${stock.score.momentum || 'N/A'}/100
- Trend: ${stock.score.trend || 'N/A'}/100 | Hacim: ${stock.score.volume || 'N/A'}/100
- Risk Skoru: ${stock.risk.score}/100 (${stock.risk.level})
- Ultra-Elite: ${stock.isUltraElite ? 'EVET' : 'HAYIR'} (${stock.ultraEliteScore || 0}/100)
- Kompozit Skor: ${stock.compositeScore || 'N/A'}/100
- Sinyal Gucu: ${stock.signalStrength?.label || 'N/A'} (${stock.signalStrength?.value || 0})

KARAR:
- Aksiyon: ${stock.decision.action}
- Guven: %${stock.decision.conviction || stock.decision.confidence || 0}
- Nedenler: ${stock.decision.reasoning?.slice(0, 3).join(' | ') || 'N/A'}

------- SABAH YESIL ANALIZI -------
- Morning Green Skor: ${morningGreen?.morningGreenScore || 0}/100
- Tarihsel Sabah Yesil Orani: %${morningGreen?.historicalGreenRate?.toFixed(1) || 'N/A'}
- Son 5 Gunde Yesil Sabah: ${morningGreen?.stats?.greenMornings5d || 'N/A'}/5 (%${morningGreen?.stats?.greenMorningRate5d?.toFixed(0) || 'N/A'})
- Son 10 Gunde Yesil Sabah: ${morningGreen?.stats?.greenMornings10d || 'N/A'}/10 (%${morningGreen?.stats?.greenMorningRate10d?.toFixed(0) || 'N/A'})
- Ort. Sabah Gap: %${morningGreen?.stats?.avgMorningGap?.toFixed(2) || 'N/A'}
- Ort. Sabah Hareket: %${morningGreen?.stats?.avgMorningMove?.toFixed(2) || 'N/A'}
- 17:45 Guvenilirlik: %${morningGreen?.stats?.afternoonReliability?.toFixed(0) || 'N/A'}
- Ust Uste Yesil Sabah: ${morningGreen?.patterns?.consecutiveGreenMornings || 0} gun
- Hot Streak: ${morningGreen?.patterns?.isHotStreak ? 'EVET' : 'HAYIR'}
- Momentum Var: ${morningGreen?.patterns?.hasMomentum ? 'EVET' : 'HAYIR'}

------- OVERNIGHT ANALIZI -------
- Overnight Sabah Yesil Orani: %${overnight?.overallMorningGreenRate?.toFixed(1) || 'N/A'}
- Haftalik Overnight Skor: ${overnight?.weeklyScore || 0}/100
- Beklenen Gap: %${overnight?.prediction?.expectedGap?.toFixed(2) || 'N/A'}
- Gap Tahmini Olasiligi: %${overnight?.prediction?.probability || 'N/A'}
- Tahmin Guveni: %${overnight?.prediction?.confidence || 'N/A'}
- Aksam Stratejisi: ${overnight?.strategy?.eveningAction || 'N/A'}
- Sabah Stratejisi: ${overnight?.strategy?.morningAction || 'N/A'}
- Strateji Gerekceleri: ${overnight?.strategy?.reasoning?.join(' | ') || 'N/A'}
- Overnight Faktorler: Trend ${overnight?.factors?.trendScore || 'N/A'} | Momentum ${overnight?.factors?.momentumScore || 'N/A'} | Hacim ${overnight?.factors?.volumeScore || 'N/A'}

------- TEKNIK INDIKATORLER -------
RSI: ${indicators?.rsi?.current?.toFixed(1) || 'N/A'} (Onceki: ${indicators?.rsi?.previous?.toFixed(1) || 'N/A'}) - Divergence: ${indicators?.rsi?.divergence || 'none'}
MACD: Histogram ${indicators?.macd?.histogram?.toFixed(4) || 'N/A'} | Crossover: ${indicators?.macd?.crossover || 'none'} | Divergence: ${indicators?.macd?.divergence || 'none'}
Stochastic: K=${indicators?.stochastic?.k?.toFixed(1) || 'N/A'} D=${indicators?.stochastic?.d?.toFixed(1) || 'N/A'} - ${indicators?.stochastic?.crossover || 'none'}
ADX: ${indicators?.adx?.value?.toFixed(1) || 'N/A'} (+DI: ${indicators?.adx?.plusDI?.toFixed(1) || 'N/A'} -DI: ${indicators?.adx?.minusDI?.toFixed(1) || 'N/A'}) - ${indicators?.adx?.trend || 'N/A'}
ATR: ${indicators?.atr?.value?.toFixed(2) || 'N/A'} (%${(indicators?.atr?.percent || 0) * 100}%)
EMA Dizilimi: ${indicators?.ema?.alignment || 'N/A'}
EMA Seviyeleri: 8=${indicators?.ema?.ema8?.toFixed(2) || 'N/A'} | 21=${indicators?.ema?.ema21?.toFixed(2) || 'N/A'} | 50=${indicators?.ema?.ema50?.toFixed(2) || 'N/A'} | 200=${indicators?.ema?.ema200?.toFixed(2) || 'N/A'}
Bollinger: Ust=${indicators?.bollinger?.upper?.toFixed(2) || 'N/A'} | Orta=${indicators?.bollinger?.middle?.toFixed(2) || 'N/A'} | Alt=${indicators?.bollinger?.lower?.toFixed(2) || 'N/A'}
Bollinger %B: ${indicators?.bollinger?.percentB?.toFixed(2) || 'N/A'} - Pozisyon: ${indicators?.bollinger?.position || 'N/A'}
Ichimoku: Tenkan=${indicators?.ichimoku?.tenkan?.toFixed(2) || 'N/A'} | Kijun=${indicators?.ichimoku?.kijun?.toFixed(2) || 'N/A'}
Ichimoku Bulut: ${indicators?.ichimoku?.cloudColor || 'N/A'} - Fiyat vs Bulut: ${indicators?.ichimoku?.priceVsCloud || 'N/A'}
OBV Trend: ${indicators?.obv?.trend || 'N/A'} - Divergence: ${indicators?.obv?.divergence || 'none'}
VWAP: ${indicators?.vwap?.value?.toFixed(2) || 'N/A'} (Sapma: ${indicators?.vwap?.deviation?.toFixed(2) || 'N/A'})
Gunluk Trend: ${indicators?.dailyTrend || 'N/A'}

------- PRO TRADER KRITERLERI -------
Pro Skor: ${proTrader?.proScore || 0}/100
Pro Grade: ${proTrader?.proGrade || 'N/A'}
Pro Sinyal: ${proTrader?.proSignal || 'N/A'}
Pro Nedenler: ${proTrader?.proReasons?.join(' | ') || 'N/A'}

MINERVINI TEMPLATE:
- Gecti mi: ${proTrader?.minerviniTemplate?.passed ? 'EVET GECTI' : 'HAYIR GECMEDI'}
- Skor: ${proTrader?.minerviniTemplate?.score || 0}/100

KURUMSAL BIRIKIM:
- Sinyal: ${proTrader?.institutionalAccumulation?.signal || 'N/A'}
- Skor: ${proTrader?.institutionalAccumulation?.score || 0}/100
- Aciklama: ${proTrader?.institutionalAccumulation?.description || 'N/A'}

RELATIVE STRENGTH:
- RS Rating: ${proTrader?.relativeStrength?.rsRating || 0}
- 3 Aylik RS: ${proTrader?.relativeStrength?.rs3m || 'N/A'}
- 6 Aylik RS: ${proTrader?.relativeStrength?.rs6m || 'N/A'}
- Piyasayi Yeniyor mu: ${proTrader?.relativeStrength?.marketOutperformance ? 'EVET' : 'HAYIR'}

SMART MONEY / BUYUK OYUNCU:
- Aktivite: ${proTrader?.smartMoneyFlow?.bigPlayerActivity || 'N/A'}
- Skor: ${proTrader?.smartMoneyFlow?.score || 0}/100
- Net Akis: ${proTrader?.smartMoneyFlow?.netFlow || 'N/A'}

HACIM PROFILI:
- Birikim: ${proTrader?.volumeProfile?.accumulation ? 'EVET' : 'HAYIR'}
- Dagitim: ${proTrader?.volumeProfile?.distribution ? 'EVET' : 'HAYIR'}
- Sinyal: ${proTrader?.volumeProfile?.signal || 'N/A'}

BREAKOUT ANALIZI:
- Kirilim Yakin mi: ${proTrader?.breakoutAnalysis?.nearBreakout ? 'EVET' : 'HAYIR'}
- Kirilima Uzaklik: %${proTrader?.breakoutAnalysis?.breakoutDistance?.toFixed(2) || 'N/A'}
- Baz Uzunlugu: ${proTrader?.breakoutAnalysis?.baseLength || 'N/A'} gun

------- HEDEF VE RISK -------
Hedef Fiyatlar:
- Konservatif: ${target?.conservative?.toFixed(2) || 'N/A'} TL
- Orta: ${target?.moderate?.toFixed(2) || 'N/A'} TL
- Agresif: ${target?.aggressive?.toFixed(2) || 'N/A'} TL
Stop Loss: ${target?.stopLoss?.toFixed(2) || 'N/A'} TL
Risk/Odul Oranlari: Konservatif ${target?.riskRewardRatios?.conservative?.toFixed(2) || 'N/A'}:1 | Orta ${target?.riskRewardRatios?.moderate?.toFixed(2) || 'N/A'}:1 | Agresif ${target?.riskRewardRatios?.aggressive?.toFixed(2) || 'N/A'}:1

PIVOT SEVIYELERI:
R3: ${stock.pivots?.r3?.toFixed(2) || 'N/A'} | R2: ${stock.pivots?.r2?.toFixed(2) || 'N/A'} | R1: ${stock.pivots?.r1?.toFixed(2) || 'N/A'}
Pivot: ${stock.pivots?.pivot?.toFixed(2) || 'N/A'}
S1: ${stock.pivots?.s1?.toFixed(2) || 'N/A'} | S2: ${stock.pivots?.s2?.toFixed(2) || 'N/A'} | S3: ${stock.pivots?.s3?.toFixed(2) || 'N/A'}
`;
    }).join('\n\n');

    const prompt = `Sen dunya capinda taninmis bir profesyonel trader ve Borsa Istanbul uzmanisin. 
Mark Minervini, William O'Neil, Paul Tudor Jones ve Stan Weinstein gibi efsanevi trader'larin metodolojilerini kullaniyorsun.

TRADING STRATEJISI - OVERNIGHT GAP:
- Saat 17:45'te (kapanistan 15 dk once) ALIS yapilacak
- Sabah 10:00'dan sonra hisse YESIL ACARSA hemen SATIS yapilacak
- AMAC: Aksam aldiktan sonra SABAH KIRMIZI ACMAMASI

YUKARIDAKI TUM VERILER BU 5 HISSE ICIN GERCEK SISTEM VERILERIDIR.
BU VERILERI ANALIZ ET VE HER HISSE ICIN NET TAVSIYE VER.

ELITE TARAMA SONUCLARI - TOP 5 ULTRA ELITE HISSE:
${stocksSummary}

GOREV: Her hisse icin DETAYLI analiz yap:

1. TUM ARTILARI LISTELE (pozitif faktorler)
2. TUM EKSILERI LISTELE (negatif faktorler / riskler)
3. SABAH YESIL ACMA OLASILIGI tahmin et (0-100)
4. GECE RISKI degerlendir (dusuk/orta/yuksek)
5. NET TAVSIYE VER:
   - "POZISYON_AC" = Tum kriterler olumlu, guvenle giris yap
   - "DIKKATLI_OL" = Bazi riskler var, kucuk pozisyon veya bekle
   - "UZAK_DUR" = Riskli, pozisyon acma

KRITERLER:
- POZISYON_AC icin: Sabah yesil skoru >= 70, kurumsal birikim pozitif, Minervini GECTI, smart money buying, RSI 40-70, EMA dizilimi bullish, risk dusuk/orta
- DIKKATLI_OL icin: Bazi kriterler eksik ama tehlikeli degil
- UZAK_DUR icin: Sabah yesil skoru < 50, kurumsal dagitim, risk yuksek, bearish sinyaller

JSON formatinda yanit ver:
{
  "analyses": [
    {
      "symbol": "XXXXX",
      "morningGreenProbability": 0-100,
      "overnightRisk": "dusuk" | "orta" | "yuksek",
      "recommendation": "POZISYON_AC" | "DIKKATLI_OL" | "UZAK_DUR",
      "reasoning": "Net ve kisa aciklama (max 50 kelime)",
      "positives": ["arti1", "arti2", "arti3", "arti4", "arti5"],
      "negatives": ["eksi1", "eksi2", "eksi3"],
      "keyMetrics": {
        "sabahYesilSkoru": 0-100,
        "proTraderSkoru": 0-100,
        "minerviniGecti": true/false,
        "kurumsalSinyal": "accumulation/distribution/neutral",
        "smartMoney": "buying/selling/neutral",
        "rsiDurumu": "oversold/normal/overbought",
        "trendDurumu": "bullish/bearish/mixed"
      },
      "riskAnalysis": {
        "maxKayip": "% olarak",
        "stopLoss": "fiyat",
        "riskSeviyesi": "dusuk/orta/yuksek/cok_yuksek"
      },
      "entryStrategy": {
        "girisZamani": "17:45 / bekle / girilmez",
        "girisFiyati": "fiyat veya aralik",
        "pozisyonBoyutu": "tam / yarim / ceyrek / girilmez"
      }
    }
  ],
  "ranking": ["EN_IYI", "2.", "3.", "4.", "EN_KOTU"],
  "topPick": {
    "symbol": "EN_IYI_HISSE",
    "confidence": 0-100,
    "reasoning": "Neden bu hisse en iyi secim (max 50 kelime)",
    "expectedReturn": "% beklenen getiri"
  },
  "avoidList": ["UZAK_DURULACAK_HISSELER"],
  "marketOutlook": "Genel piyasa gorunumu ve overnight risk degerlendirmesi (max 50 kelime)",
  "disclaimer": "Bu bir yatirim tavsiyesi degildir, sadece teknik analizdir."
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Sen Mark Minervini ve William O'Neil metodolojilerini kullanan profesyonel bir Turk borsa analistisin. 
Overnight gap stratejisi konusunda uzmansın - yani aksam kapanistan once alip sabah yesil acilista satan bir strateji.

ONEMLI KURALLAR:
1. Tum verileri dikkatle oku ve analiz et
2. Her hisse icin ARTILARI ve EKSILERI ayri ayri listele
3. Net tavsiye ver: POZISYON_AC / DIKKATLI_OL / UZAK_DUR
4. Turkce karakterler kullan
5. Yanıtın SADECE JSON formatinda olmali
6. Yatırım tavsiyesi vermediğini her zaman belirt`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: GROQ_MODEL,
      temperature: 0.2, // Cok tutarli sonuclar icin dusuk temperature
      max_tokens: 4000, // Daha fazla token - detayli analiz icin
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // JSON parse etmeyi dene
    let analysis = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("JSON parse hatasi:", parseError);
      // Fallback response - verilere dayali otomatik analiz
      analysis = {
        analyses: stocks.map(s => {
          const morningScore = s.morningGreen?.morningGreenScore || 50;
          const proScore = s.proTraderCriteria?.proScore || 50;
          const minerviniPassed = s.proTraderCriteria?.minerviniTemplate?.passed || false;
          const institutional = s.proTraderCriteria?.institutionalAccumulation?.signal || 'neutral';
          const smartMoney = s.proTraderCriteria?.smartMoneyFlow?.bigPlayerActivity || 'neutral';
          const riskLevel = s.risk.level;
          
          // Otomatik tavsiye hesapla
          let recommendation = 'DIKKATLI_OL';
          if (
            morningScore >= 70 &&
            proScore >= 70 &&
            minerviniPassed &&
            (institutional === 'strong_accumulation' || institutional === 'accumulation') &&
            (smartMoney === 'buying' || smartMoney === 'neutral') &&
            (riskLevel === 'low' || riskLevel === 'very_low' || riskLevel === 'medium')
          ) {
            recommendation = 'POZISYON_AC';
          } else if (
            morningScore < 50 ||
            riskLevel === 'very_high' || riskLevel === 'extreme' ||
            institutional === 'distribution' ||
            smartMoney === 'selling'
          ) {
            recommendation = 'UZAK_DUR';
          }
          
          return {
            symbol: s.symbol,
            morningGreenProbability: morningScore,
            overnightRisk: riskLevel === 'low' || riskLevel === 'very_low' ? 'dusuk' : riskLevel === 'high' || riskLevel === 'very_high' ? 'yuksek' : 'orta',
            recommendation,
            reasoning: "AI analizi yapilamadi - sistem skorlarina dayali otomatik degerlendirme",
            positives: [
              `Morning Green Skor: ${morningScore}`,
              `Pro Skor: ${proScore}`,
              minerviniPassed ? "Minervini template gecti" : null,
              institutional.includes('accumulation') ? "Kurumsal birikim pozitif" : null,
              smartMoney === 'buying' ? "Smart money aliyor" : null
            ].filter(Boolean) as string[],
            negatives: [
              !minerviniPassed ? "Minervini template gecmedi" : null,
              institutional === 'distribution' ? "Kurumsal dagitim var" : null,
              smartMoney === 'selling' ? "Smart money satiyor" : null,
              riskLevel === 'high' || riskLevel === 'very_high' ? "Risk seviyesi yuksek" : null
            ].filter(Boolean) as string[],
            keyMetrics: {
              sabahYesilSkoru: morningScore,
              proTraderSkoru: proScore,
              minerviniGecti: minerviniPassed,
              kurumsalSinyal: institutional,
              smartMoney: smartMoney,
              rsiDurumu: (s.indicators?.rsi?.current || 50) < 30 ? 'oversold' : (s.indicators?.rsi?.current || 50) > 70 ? 'overbought' : 'normal',
              trendDurumu: s.indicators?.ema?.alignment || 'mixed'
            },
            riskAnalysis: {
              maxKayip: `%${s.risk.score / 10}`,
              stopLoss: s.target?.stopLoss?.toFixed(2) || 'N/A',
              riskSeviyesi: riskLevel
            },
            entryStrategy: {
              girisZamani: recommendation === 'POZISYON_AC' ? '17:45' : recommendation === 'DIKKATLI_OL' ? 'bekle' : 'girilmez',
              girisFiyati: s.price.current.toFixed(2),
              pozisyonBoyutu: recommendation === 'POZISYON_AC' ? 'tam' : recommendation === 'DIKKATLI_OL' ? 'yarim' : 'girilmez'
            }
          };
        }),
        ranking: stocks.map(s => s.symbol),
        topPick: {
          symbol: stocks[0]?.symbol || "N/A",
          confidence: 50,
          reasoning: "AI analizi yapilamadi - sistem skorlarina dayali",
          expectedReturn: "N/A"
        },
        avoidList: stocks.filter(s => 
          s.risk.level === 'high' || s.risk.level === 'very_high' ||
          s.proTraderCriteria?.institutionalAccumulation?.signal === 'distribution'
        ).map(s => s.symbol),
        marketOutlook: "AI analizi su an kullanilamiyor - sistem verileri kullaniliyor.",
        disclaimer: "Bu bir yatirim tavsiyesi degildir, sadece teknik analizdir.",
        rawResponse: responseText
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GROQ Elite Analiz hatasi:", error);
    return NextResponse.json(
      { error: "AI analizi yapilirken hata olustu", details: String(error) },
      { status: 500 }
    );
  }
}
