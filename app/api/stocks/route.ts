import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { getYahooSymbol } from "@/lib/bist-stocks";
import type { StockData } from "@/lib/types";

// Yahoo Finance v3 - instance based API
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json(
      { error: "Semboller gerekli" },
      { status: 400 }
    );
  }

  const symbolList = symbols.split(",").map((s) => s.trim());
  console.log("[v0] Taranan semboller:", symbolList.length);

  try {
    const stockData: StockData[] = [];
    
    // Sirayla tara - paralel cok fazla istek yapiyor
    for (const symbol of symbolList) {
      const yahooSymbol = getYahooSymbol(symbol);
      
      try {
        const quote = await yahooFinance.quote(yahooSymbol);
        
        if (quote && quote.regularMarketPrice) {
          stockData.push({
            symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap,
            previousClose: quote.regularMarketPreviousClose || 0,
            dayHigh: quote.regularMarketDayHigh || 0,
            dayLow: quote.regularMarketDayLow || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.log(`[v0] Hisse alinamadi: ${symbol}`, error);
      }
    }

    console.log("[v0] Basarili veri sayisi:", stockData.length);
    return NextResponse.json({ data: stockData, total: stockData.length });
  } catch (error) {
    console.error("[v0] Yahoo Finance API hatasi:", error);
    return NextResponse.json(
      { error: "Veri alinirken hata olustu" },
      { status: 500 }
    );
  }
}

// Tek hisse icin POST endpoint
export async function POST(request: Request) {
  try {
    const { symbols } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: "Sembol listesi gerekli" }, { status: 400 });
    }

    console.log("[v0] POST - Taranan sembol sayisi:", symbols.length);
    const stockData: StockData[] = [];

    for (const symbol of symbols) {
      const yahooSymbol = getYahooSymbol(symbol);
      
      try {
        const quote = await yahooFinance.quote(yahooSymbol);
        
        if (quote && quote.regularMarketPrice) {
          stockData.push({
            symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap,
            previousClose: quote.regularMarketPreviousClose || 0,
            dayHigh: quote.regularMarketDayHigh || 0,
            dayLow: quote.regularMarketDayLow || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            lastUpdated: new Date(),
          });
        }
      } catch (error) {
        console.log(`[v0] POST Hisse alinamadi: ${symbol}`);
      }
    }

    console.log("[v0] POST Basarili veri sayisi:", stockData.length);
    return NextResponse.json({ 
      success: true, 
      data: stockData,
      total: stockData.length 
    });
  } catch (error) {
    console.error("[v0] POST API Hatasi:", error);
    return NextResponse.json(
      { error: "Veri cekilemedi", details: String(error) },
      { status: 500 }
    );
  }
}
