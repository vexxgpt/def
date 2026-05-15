import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_API_KEY, GROQ_MODEL } from "@/lib/groq-config";

export const dynamic = "force-dynamic";

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, stockData, action } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: "Hisse sembolü gerekli" },
        { status: 400 }
      );
    }

    let prompt = "";

    if (action === "analyze") {
      prompt = `Sen bir profesyonel Türk borsa analisti olarak ${symbol} hissesini analiz et.

Güncel Veriler:
- Fiyat: ${stockData?.price || "Bilinmiyor"} TL
- Günlük Değişim: %${stockData?.changePercent?.toFixed(2) || "Bilinmiyor"}
- Hacim: ${stockData?.volume?.toLocaleString("tr-TR") || "Bilinmiyor"}
- Önceki Kapanış: ${stockData?.previousClose || "Bilinmiyor"} TL
- Günün En Yükseği: ${stockData?.dayHigh || "Bilinmiyor"} TL
- Günün En Düşüğü: ${stockData?.dayLow || "Bilinmiyor"} TL

Trading Stratejim:
- Saat 17:30'da (kapanıştan 15 dk önce) alım yapıyorum
- Sabah 10:00'dan sonra %1 yükseldiğinde satıyorum

Bu strateji için ${symbol} hissesini değerlendir:
1. Bu hisse bu strateji için uygun mu?
2. Risk seviyesi nedir?
3. Kısa vadeli görünüm nasıl?

Yanıtını Türkçe ve kısa tut (max 150 kelime). JSON formatında döndür:
{
  "recommendation": "al" | "sat" | "tut" | "bekle",
  "confidence": 0-100 arası sayı,
  "reasoning": "Kısa açıklama",
  "riskLevel": "düşük" | "orta" | "yüksek",
  "shortTermOutlook": "pozitif" | "nötr" | "negatif"
}`;
    } else if (action === "market_summary") {
      prompt = `Borsa İstanbul için kısa bir piyasa özeti yap. Genel trend, dikkat edilmesi gereken sektörler ve günün öne çıkan gelişmeleri hakkında bilgi ver. Türkçe yanıt ver, maksimum 100 kelime.`;
    } else {
      prompt = `${symbol} hakkında kısa bir yorum yap. Türkçe yanıt ver, maksimum 50 kelime.`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Sen deneyimli bir Türk borsa analistisin. Yanıtların kısa, öz ve Türkçe olmalı. Yatırım tavsiyesi vermediğini, sadece analiz yaptığını belirt.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: GROQ_MODEL,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    // JSON parse etmeyi dene
    let analysis = null;
    if (action === "analyze") {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        }
      } catch {
        // JSON parse edilemezse text olarak döndür
        analysis = {
          recommendation: "bekle",
          confidence: 50,
          reasoning: responseText,
          riskLevel: "orta",
          shortTermOutlook: "nötr",
        };
      }
    }

    return NextResponse.json({
      success: true,
      symbol,
      analysis: analysis || responseText,
      rawResponse: responseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GROQ API hatası:", error);
    return NextResponse.json(
      { error: "AI analizi yapılırken hata oluştu" },
      { status: 500 }
    );
  }
}
