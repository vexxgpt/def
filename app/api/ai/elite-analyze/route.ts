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

    const prompt = `Sen dunya capinda bir profesyonel trader ve Borsa Istanbul uzmanisin. 
Mark Minervini, William O'Neil ve Paul Tudor Jones gibi efsanevi trader'larin metodolojilerini kullaniyorsun.

TRADING STRATEJISI:
- Saat 17:45'te (kapanistan 15 dk once) ALIS yapilacak
- Sabah 10:00'dan sonra hisse YESIL ACARSA hemen SATIS yapilacak
- AMAC: Aksam aldiktan sonra SABAH KIRMIZI ACMAMASI - yani overnight gap up stratejisi

ELITE TARAMA SONUCLARI - TOP 5 HISSE:
${stocksSummary}

GOREV:
Bu 5 hisseyi detayli analiz et ve SABAH YESIL YAKIP YAKMAYACAGINI tahmin et.

Her hisse icin:
1. Sabah yesil acma olasiligi (0-100)
2. Gece riski (dusuk/orta/yuksek)
3. Tavsiye (AKSAM AL / BEKLE / UZAK DUR)
4. Kisa aciklama (max 30 kelime)

Sonra TUM 5 HISSEYI KARSILASTIR ve en iyiden en kotuye SIRALA.

ONEMLI: Sadece GERCEK VERILERE dayanarak karar ver. Sabah yesil orani, overnight skoru, pro trader kriterleri, kurumsal birikim ve smart money akisi en onemli faktorler.

JSON formatinda yanit ver:
{
  "analyses": [
    {
      "symbol": "XXXXX",
      "morningGreenProbability": 0-100,
      "overnightRisk": "dusuk" | "orta" | "yuksek",
      "recommendation": "AKSAM_AL" | "BEKLE" | "UZAK_DUR",
      "reasoning": "Kisa aciklama",
      "keyFactors": ["faktor1", "faktor2", "faktor3"]
    }
  ],
  "ranking": ["BEST_SYMBOL", "2ND", "3RD", "4TH", "WORST_SYMBOL"],
  "topPick": {
    "symbol": "EN_IYI_HISSE",
    "confidence": 0-100,
    "reasoning": "Neden bu hisse en iyi secim"
  },
  "marketOutlook": "Genel piyasa gorunumu ve overnight risk degerlendirmesi (max 50 kelime)",
  "disclaimer": "Bu bir yatirim tavsiyesi degildir, sadece teknik analizdir."
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
  } catch (error) {
    console.error("GROQ Elite Analiz hatasi:", error);
    return NextResponse.json(
      { error: "AI analizi yapilirken hata olustu", details: String(error) },
      { status: 500 }
    );
  }
}
