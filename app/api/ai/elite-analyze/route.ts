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

    const prompt = `ROLUNUZ: Mark Minervini, William O'Neil ve Paul Tudor Jones metodolojilerini kullanan PROFESYONEL BORSA ANALISTI
TARAYICI: 35 İNDİKATÖR (Minervini Template, Momentum, Volume, Trend, Price Action, Smart Money akımları vb.)
STRATEJI: Overnight Gap-Up Trading - Saat 17:45'te AL, Sabah 10:00+ YESIL AÇILIŞTA SAT

=== ELITE SCANNER SONUÇLARI ===
${stocksSummary}

=== DETAYLI ANALİZ TALİMATLARI ===

HER HİSSE İÇİN ŞU MADDELERİ ANALIZE TÜM 35 İNDİKATÖR'Ü KULLANAK DETAYLI YAZ:

1. **GENEL BAKIŞ**: (2-3 cümle)
   - Hissenin genel durumu
   - Trendinin yönü (Yükselen/Düşen/Yatay)
   - Momentum durumu
   - Fiyat hareketi karakteri

2. **SINYALLER** (Minimum 5-6 ayrı sinyal, her biri açıklanması gerekli):
   - Minervini Template sinyalleri (Trend, Momentum, RS, Consolidation vb.)
   - Volume sinyalleri (Akkümülasyon, Distribüsyon)
   - Price Action sinyalleri (Double Bottom, Cup & Handle, vb.)
   - Kurumsal birikim sinyalleri
   - Smart Money akışı sinyalleri
   - Momentum göstergeleri (MACD, RSI, Stochastic vb.)
   - Her sinyal için yüzde skoru ver (ör: %85, %90, vb.)

3. **RISK ANALİZİ** (Minimum 4-5 spesifik risk, her biri yüzde olasılıkla):
   - Gece riski (Gap down olasılığı - %)
   - Stop loss kırılma riski (%)
   - Kurumsal satış riski (%)
   - Piyasa riski (Genel BIST düşüş riski)
   - Teknik direnç kırılma riski (%)
   - Manuplasyon riski (%)

4. **HEDEFLER** (Detaylı seviyeleri TL cinsinden ver):
   - AL: Önerilen alış seviyesi
   - KÂR SATIŞ 1: İlk kar satış hedefi (%2-3)
   - KÂR SATIŞ 2: İkinci kar satış hedefi (%4-6)
   - KÂR SATIŞ 3: Nihai kar satış hedefi (%8-12)
   - STOP LOSS: Stop loss seviyesi

5. **TEKNİK ANALİZ** (Detaylı destek/direnç):
   - Kısa dönem destek seviyeleri
   - Orta dönem destek seviyeleri
   - Direnç seviyeleri
   - İçteki Doji/Engulfing patternleri
   - Fibonacci seviyeleri
   - Pivot seviyeleri

6. **OVERNIGHT RİSK DETAYLARI** (Overnight gap stratejisine göre):
   - Sabah yeşil açma olasılığı (%)
   - Gap up beklenen % miktarı
   - Gap down riski (%)
   - Overnight düşüş olasılığı (%)
   - Tarihsel sabah yeşil oranı
   - Haftanın ve ayın eğilimi

7. **PRO TRADER PERSPEKTİFİ** (Kurumsal/Smart Money):
   - Akıllı para hareketi (Büyük oyuncu alış/satış)
   - Kurumsal katılım derecesi (%)
   - Block trades aktivitesi
   - Options flow sinyalleri
   - Insider activity düzeyi
   - Short covering olasılığı

8. **POZİSYON MIKTARI**: Portfolio'nun kaçta kaçı bu hisseye yatırılmalı (%)
   - Düşük riskli (düşük yeşil olasılığı): %2-3
   - Orta riskli (orta yeşil olasılığı): %5-7
   - Yüksek güven (yüksek yeşil olasılığı): %8-12

=== JSON YANIT FORMATІ ===
YANIT SADECE BU JSON FORMATINDA OLMALI (Türkçe karakterler gerekli):

{
  "topPick": {
    "symbol": "EN_İYİ_HİSSE",
    "confidence": 85-100,
    "reasoning": "Bu hisse neden #1 seçim - önemli nedenleri 1 cümle"
  },
  "analyses": [
    {
      "symbol": "XXXXX",
      "morningGreenProbability": 0-100,
      "overnightRisk": "düşük" | "orta" | "yüksek",
      "recommendation": "AKSAM_AL" | "BEKLE" | "UZAK_DUR",
      "reasoning": "Spesifik neden tavsiyesi (2-3 cümle, somut veriler içermeli)",
      "positionSize": "%X (Açıklama: neden bu yüzde)",
      "genel": "Hissenin genel durumu, trend ve momentum (2-3 cümle)",
      "signals": [
        "Sinyal 1: Açıklaması (%YZ skoru)",
        "Sinyal 2: Açıklaması (%YZ skoru)",
        "Sinyal 3: Açıklaması (%YZ skoru)",
        "Sinyal 4: Açıklaması (%YZ skoru)",
        "Sinyal 5: Açıklaması (%YZ skoru)",
        "Sinyal 6: Açıklaması (%YZ skoru)"
      ],
      "riskAnalysis": "Detaylı risk değerlendirmesi:\n- Risk 1: Açıklama (% olasılık)\n- Risk 2: Açıklama (% olasılık)\n- Risk 3: Açıklama (% olasılık)\n- Risk 4: Açıklama (% olasılık)\n- Risk 5: Açıklama (% olasılık)",
      "targets": {
        "buy": "AL: X.XX TL (Açıklama)",
        "take_profit_1": "KAR_1: X.XX TL (%+2-3)",
        "take_profit_2": "KAR_2: X.XX TL (%+4-6)",
        "take_profit_3": "KAR_3: X.XX TL (%+8-12)",
        "stop_loss": "STOP: X.XX TL (Açıklama)"
      },
      "technical": "Destek-Direnç: Kısa dönem destek: X.XX TL, Orta dönem destek: X.XX TL, Direnç: X.XX TL. Pattern: [Pattern adı]. Fibonacci: [Seviyeleri]. Pivot: [Seviyeleri]",
      "overnight": "Sabah yeşil olasılığı: %X (Tarihsel %Y). Gap up beklentisi: %Z. Gap down riski: %A. Gece düşüş riski: %B. Haftalık trend: [Trend]. Overnight bloklar: [Aktivite seviyesi]",
      "proTrader": "Smart money: [Alış/Satış durumu %]. Kurumsal katılım: %X derece. Block trades: [Aktivite]. Options flow: [Sinyal]. Akıllı para hareketi: [Hareket]. Short covering: %Y olasılıkla beklenir"
    }
  ],
  "ranking": ["EN_İYİ", "2.SİRA", "3.SİRA", "4.SİRA", "5.SİRA"],
  "marketOutlook": "Genel BIST trendi [Trend]. Overnight riski [Seviye]. Sektör duyarlılığı [Yön]. Koruma alması gereken seviye: X.XXX",
  "disclaimer": "Bu bir yatırım tavsiyesi değildir, sadece teknik analiz amaçlıdır."
}

=== ÖNEMLİ HATIRLATMALAR ===
1. HER YANIT DETAYLI, SOMUT VERILER VE YÜZDE İLE DESTEKLENMEŞ OLMALI
2. 35 İNDİKATÖRÜN HEPSİNİ DÜŞÜNEREk ANALİZ YAP
3. SINYAL, RISK, HEDEF, TEKNİK HER BİR BÖLÜMDE MİNİMUM 5-6 DETAY OLMALI
4. POZİSYON MIKTARI AÇIKLANMIŞ OLMALI
5. TÜM YÜZDE VE SEVİYELER SPESİFİK OLMALI (Kesinlikle)
6. JSON FORMATINDA HATALI OLMAMALI, PARSE EDİLEBİLİR OLMALI`;

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
