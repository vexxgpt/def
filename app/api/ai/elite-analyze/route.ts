import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_API_KEY, GROQ_MODEL } from "@/lib/groq-config";

export const dynamic = "force-dynamic";

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

interface EliteStockData {
  symbol: string;
  name: string;
  price: {
    current: number;
    change: number;
    changePercent: number;
  };
  score: {
    total: number;
  };
  risk: {
    level: string;
    score: number;
  };
  decision: {
    action: string;
    confidence: number;
  };
  morningGreen?: {
    morningGreenScore: number;
    historicalGreenRate: number;
  };
  overnightAnalysis?: {
    overallMorningGreenRate: number;
    weeklyScore: number;
    prediction?: {
      probability: number;
      expectedGap: number;
    };
  };
  proTraderCriteria?: {
    proScore: number;
    proGrade: string;
    proSignal: string;
    proReasons: string[];
    minerviniTemplate?: {
      passed: boolean;
      score: number;
    };
    institutionalAccumulation?: {
      signal: string;
      score: number;
    };
    relativeStrength?: {
      rsRating: number;
    };
    smartMoneyFlow?: {
      bigPlayerActivity: string;
    };
  };
  ultraEliteScore?: number;
  isUltraElite?: boolean;
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

    // Her hisse icin detayli veri ozeti olustur
    const stocksSummary = stocks.map((stock, index) => {
      const proTrader = stock.proTraderCriteria;
      const overnight = stock.overnightAnalysis;
      const morningGreen = stock.morningGreen;
      
      return `
${index + 1}. ${stock.symbol} (${stock.name})
   - Fiyat: ${stock.price.current.toFixed(2)} TL (${stock.price.changePercent >= 0 ? '+' : ''}${stock.price.changePercent.toFixed(2)}%)
   - Elite Skor: ${stock.score.total}/100
   - Ultra-Elite: ${stock.isUltraElite ? 'EVET' : 'HAYIR'} (Skor: ${stock.ultraEliteScore || 'N/A'})
   - Risk: ${stock.risk.level} (${stock.risk.score}/100)
   - Karar: ${stock.decision.action} (Guven: %${stock.decision.confidence})
   
   SABAH YESIL ANALIZI:
   - Morning Green Skor: ${morningGreen?.morningGreenScore || 'N/A'}/100
   - Tarihsel Sabah Yesil Orani: %${morningGreen?.historicalGreenRate?.toFixed(1) || 'N/A'}
   - Overnight Sabah Yesil Orani: %${overnight?.overallMorningGreenRate?.toFixed(1) || 'N/A'}
   - Haftalik Overnight Skor: ${overnight?.weeklyScore || 'N/A'}/100
   - Beklenen Gap: %${overnight?.prediction?.expectedGap?.toFixed(2) || 'N/A'}
   - Tahmin Olasiligi: %${overnight?.prediction?.probability || 'N/A'}
   
   PRO TRADER KRITERLERI:
   - Pro Skor: ${proTrader?.proScore || 'N/A'}/100
   - Pro Grade: ${proTrader?.proGrade || 'N/A'}
   - Pro Sinyal: ${proTrader?.proSignal || 'N/A'}
   - Minervini Template: ${proTrader?.minerviniTemplate?.passed ? 'GECTI' : 'GECMEDI'} (${proTrader?.minerviniTemplate?.score || 0}/100)
   - Kurumsal Birikim: ${proTrader?.institutionalAccumulation?.signal || 'N/A'}
   - RS Rating: ${proTrader?.relativeStrength?.rsRating || 'N/A'}
   - Smart Money: ${proTrader?.smartMoneyFlow?.bigPlayerActivity || 'N/A'}
   - Pro Nedenler: ${proTrader?.proReasons?.slice(0, 3).join(', ') || 'N/A'}
`;
    }).join('\n');

    const prompt = `GOREV: Verilen 5 hisseden HER BİRİ için DETAYLI analiz yap ve JSON döndür.

GEREKLİ VERILER (scanner'dan elde edilen):
${stocksSummary}

ANALIZ TALIMATLAR:
1. **SINYALLER**: Verilen tüm sinyalleri (%95 Minervini Template, %88 Kurumsal Birikim, %92 MACD vs) AL
2. **RISK**: Verilen tüm riskler (Gap down, Stop loss kırılma vs) AL  
3. **HEDEFLER**: Verilen tüm hedef seviyeleri AL (Muhafazakar, Orta, Agresif)
4. **TEKNİK**: Verilen Destek/Direnç/Pivot seviyeleri AL
5. **OVERNIGHT**: Verilen sabah yeşil % ve gap tahminleri AL
6. **PRO TRADER**: Verilen pro trader skorları ve sinyalleri AL

TAVSIYE:
- Sabah yeşil %95+: AKSAM_AL (%10-12 pozisyon)
- Sabah yeşil %80-95: GUCLU_AL (%8-10 pozisyon)
- Sabah yeşil %60-80: AL (%5-7 pozisyon)
- Sabah yeşil %40-60: BEKLE (%3-5 pozisyon)
- Sabah yeşil <40: UZAK_DUR (%0-2 pozisyon)

JSON OUTPUT (SADECE BU FORMAT):
{
  "topPick": {
    "symbol": "BEST_SYMBOL",
    "confidence": 95,
    "reasoning": "1 cümle neden"
  },
  "analyses": [
    {
      "symbol": "HISSE",
      "morningGreenProbability": 96,
      "overnightRisk": "dusuk",
      "recommendation": "AKSAM_AL",
      "reasoning": "2-3 cümle somut veri ile",
      "positionSize": "%10 (Cok yuksek guven)",
      "genel": "Genel durum (2-3 cümle)",
      "signals": [
        "Minervini Template GECTI (%95): Trend, Momentum, RS uyum",
        "Kurumsal BIRIKIM ISLADI (%88): Yuksek hacim gunleri, fiyat-hacim uyumu",
        "MACD Yukarida (%85): Momentum artisi, histogram genisliyor",
        "EMA Mukemmel Dizilim (%90): 5>8>13>21>34>55>89>200",
        "Ichimoku Guclu ALIŞ (%92): Fiyat bulutun ustunde, Tenkan>Kijun",
        "OBV + Accumulation (%88): Yukselen trendde alim baskisi"
      ],
      "riskAnalysis": "Gap down riski: %5 (son 5 gunde 5/5 yesil). Stop loss riski: %3 (cok yakin seviye). Kurumsal satis riski: %2 (birikim sirasi). Piyasa riski: %4 (genel BIST). Toplam risk: ~%15.",
      "targets": {
        "buy": "AL: 9.94 TL",
        "take_profit_1": "KAR1: 10.18 TL (+2.4%)",
        "take_profit_2": "KAR2: 10.43 TL (+5.0%)",
        "take_profit_3": "KAR3: 10.75 TL (+8.2%)",
        "stop_loss": "STOP: 9.22 TL (-7.2%)"
      },
      "technical": "Destek: 9.22 TL (kisa), 8.88 TL (ort), Direnç: 10.43 TL. Pivot R1: 10.43, Fib %38: 9.30, Fib %61: 8.69. Pattern: Guclu uptrend.",
      "overnight": "Sabah yesil olasiligi: %96 (son 5 gunde 5/5). Gap up: +0.39% beklenen. Gap down riski: %5. Gece dusus riski: %3. Haftalik skor: 94/100. HOT STREAK: 5 ust uste yesil!",
      "proTrader": "Smart money ALIŞ yapıyor (%95). Kurumsal katılım: yüksek derece. Block trades: aktif. Büyük oyuncu akışı: POZITIF. Confluence skor: 100/100. Grade: STRONG MORNING BUY."
    }
  ],
  "ranking": ["SYM1", "SYM2", "SYM3", "SYM4", "SYM5"],
  "marketOutlook": "Piyasa yukseli. Overnight riski dusuk. Sektор: teknik alim var.",
  "disclaimer": "Yatirim tavsiyesi degildir."
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Sen Mark Minervini ve William O'Neil metodolojilerini kullanan profesyonel bir Turk borsa analistisin. 
Overnight gap stratejisi konusunda uzmansın - yani aksam kapanistan once alip sabah yesil acilista satan bir strateji.
Yanıtların SADECE JSON formatinda olmali. Turkce karakterler kullanabilirsin.
Yatırım tavsiyesi vermediğini, sadece teknik analiz yaptiğini her zaman belirt.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: GROQ_MODEL,
      temperature: 0.3, // Daha tutarli sonuclar icin dusuk temperature
      max_tokens: 2000,
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
      // Fallback response
      analysis = {
        analyses: stocks.map(s => ({
          symbol: s.symbol,
          morningGreenProbability: s.morningGreen?.morningGreenScore || 50,
          overnightRisk: s.risk.level === 'low' ? 'dusuk' : s.risk.level === 'high' ? 'yuksek' : 'orta',
          recommendation: s.decision.action === 'STRONG_BUY' ? 'AKSAM_AL' : 'BEKLE',
          reasoning: "AI analizi yapilamadi, sistem skorlarina bakiniz",
          keyFactors: ["Veri yetersiz"]
        })),
        ranking: stocks.map(s => s.symbol),
        topPick: {
          symbol: stocks[0]?.symbol || "N/A",
          confidence: 50,
          reasoning: "AI analizi yapilamadi"
        },
        marketOutlook: "AI analizi su an kullanilamiyor.",
        disclaimer: "Bu bir yatirim tavsiyesi degildir.",
        rawResponse: responseText
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
    } catch (parseError) {
      console.error("JSON parse hatasi:", parseError);
      // Fallback response - verilen verilerden manuel olarak construct et
      analysis = {
        topPick: {
          symbol: stocks[0]?.symbol || "N/A",
          confidence: stocks[0]?.morningGreen?.morningGreenScore || 50,
          reasoning: "Sistem skorlarina gore en iyi hisse"
        },
        analyses: stocks.map(s => ({
          symbol: s.symbol,
          morningGreenProbability: s.morningGreen?.morningGreenScore || s.overnightAnalysis?.overallMorningGreenRate || 50,
          overnightRisk: s.risk.level === 'low' ? 'dusuk' : s.risk.level === 'high' ? 'yuksek' : 'orta',
          recommendation: (s.morningGreen?.morningGreenScore || 50) >= 90 ? 'AKSAM_AL' : 
                         (s.morningGreen?.morningGreenScore || 50) >= 70 ? 'GUCLU_AL' : 'BEKLE',
          reasoning: `${s.symbol} hissesi, sistem skorlarina gore analiz edilmistir. Sabah yesil olasiligi: %${s.morningGreen?.morningGreenScore || s.overnightAnalysis?.overallMorningGreenRate || 50}. Risk seviyesi: ${s.risk.level}.`,
          positionSize: `%${Math.min(12, Math.max(2, Math.round((s.morningGreen?.morningGreenScore || 50) / 10)))} (Sistem skoru tabanli)`,
          genel: `${s.symbol} hissesi trend: ${s.decision.action}, Momentum: ${s.price.changePercent >= 0 ? 'YUKSELIS' : 'DUSUS'}, Elite Skor: ${s.score.total}/100.`,
          signals: s.proTraderCriteria?.proReasons?.slice(0, 6) || [
            "Minervini Template: Sistem degerlendirmesi",
            "Volume Analiz: Veri tabaninda",
            "Trend Analiz: Sistem skoruna gore",
            "Momentum: Sistem degerlendirmesi",
            "Kurumsal Aktivite: Skora gore",
            "Smart Money: Veri analizi"
          ],
          riskAnalysis: `Gap down riski: ~%${Math.max(5, 20 - s.score.total/5)} (Skor tabanli). Stop loss riski: ~%5. Kurumsal satis riski: ~%3. Piyasa riski: ~%4. Toplam yaklasik risk: ~%${Math.max(5, 20 - s.score.total/5 + 12)}.`,
          targets: {
            buy: `AL: ${s.price.current.toFixed(2)} TL`,
            take_profit_1: `KAR1: ${(s.price.current * 1.025).toFixed(2)} TL (+2.5%)`,
            take_profit_2: `KAR2: ${(s.price.current * 1.05).toFixed(2)} TL (+5.0%)`,
            take_profit_3: `KAR3: ${(s.price.current * 1.08).toFixed(2)} TL (+8.0%)`,
            stop_loss: `STOP: ${(s.price.current * 0.93).toFixed(2)} TL (-7.0%)`
          },
          technical: `Fiyat: ${s.price.current.toFixed(2)} TL. Trend: ${s.decision.action === 'STRONG_BUY' ? 'Yukari' : 'Dusus'}. Risk Score: ${s.risk.score}/100.`,
          overnight: `Sabah yesil olasiligi: %${s.morningGreen?.morningGreenScore || s.overnightAnalysis?.overallMorningGreenRate || 50}. Gap up beklentisi: Sistem tahmini. Gap down riski: %${Math.max(5, 20 - s.score.total/5)}. Haftalik skor: ${s.overnightAnalysis?.weeklyScore || 50}/100.`,
          proTrader: `Pro Score: ${s.proTraderCriteria?.proScore || 50}/100. Minervini: ${s.proTraderCriteria?.minerviniTemplate?.passed ? 'GECTI' : 'GECMEDI'} (${s.proTraderCriteria?.minerviniTemplate?.score || 0}). Kurumsal: ${s.proTraderCriteria?.institutionalAccumulation?.signal || 'DEGER YOK'}. Smart Money: ${s.proTraderCriteria?.smartMoneyFlow?.bigPlayerActivity || 'DEGER YOK'}.`
        })),
        ranking: stocks.map(s => s.symbol),
        marketOutlook: "Sistem analizi yapilmistir. Overnight riskler degerlendirilmis, tavsiye edilir.",
        disclaimer: "Bu bir yatirim tavsiyesi degildir, sadece teknik analiz amacidir.",
        note: "JSON response parse edilemedi, sistem skorlarından fallback yanıt oluşturulmuştur."
      };
    }
}
