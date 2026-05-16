import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { getYahooSymbol } from "@/lib/bist-stocks";
import type { HistoricalDataResponse, HistoricalBar } from "@/lib/elite-scanner-types";

// Yahoo Finance v3 - instance based API
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Cache for historical data (5 minutes)
const cache = new Map<string, { data: HistoricalDataResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const days = parseInt(searchParams.get("days") || "30", 10);

  if (!symbol) {
    return NextResponse.json(
      { error: "Sembol gerekli" },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `${symbol}-${days}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  const yahooSymbol = getYahooSymbol(symbol);

  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days - 5); // Extra days for weekends

    // Get historical data using chart
    const chartResult = await yahooFinance.chart(yahooSymbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return NextResponse.json(
        { error: "Gecmis veri bulunamadi" },
        { status: 404 }
      );
    }

    // Transform to HistoricalBar format
    const bars: HistoricalBar[] = chartResult.quotes
      .filter(q => q.open !== null && q.high !== null && q.low !== null && q.close !== null && q.volume !== null)
      .map(q => ({
        date: new Date(q.date || Date.now()),
        open: q.open as number,
        high: q.high as number,
        low: q.low as number,
        close: q.close as number,
        volume: q.volume as number,
      }));

    // Get current quote
    const quote = await yahooFinance.quote(yahooSymbol);

    const response: HistoricalDataResponse = {
      symbol,
      bars,
      currentQuote: {
        price: quote.regularMarketPrice || bars[bars.length - 1]?.close || 0,
        previousClose: quote.regularMarketPreviousClose || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        dayHigh: quote.regularMarketDayHigh || 0,
        dayLow: quote.regularMarketDayLow || 0,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        name: quote.shortName || quote.longName || symbol,
      },
    };

    // Update cache
    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    return NextResponse.json(response);
  } catch (error) {
    console.error(`[v0] Historical veri hatasi (${symbol}):`, error);
    return NextResponse.json(
      { error: "Gecmis veri alinamadi", details: String(error) },
      { status: 500 }
    );
  }
}

// Batch endpoint for multiple symbols
export async function POST(request: Request) {
  try {
    const { symbols, days = 30 } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: "Sembol listesi gerekli" }, { status: 400 });
    }

    const results: HistoricalDataResponse[] = [];
    const errors: { symbol: string; error: string }[] = [];

    for (const symbol of symbols) {
      const cacheKey = `${symbol}-${days}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        results.push(cached.data);
        continue;
      }

      const yahooSymbol = getYahooSymbol(symbol);

      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days - 5);

        const chartResult = await yahooFinance.chart(yahooSymbol, {
          period1: startDate,
          period2: endDate,
          interval: "1d",
        });

        if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
          errors.push({ symbol, error: "Veri bulunamadi" });
          continue;
        }

        const bars: HistoricalBar[] = chartResult.quotes
          .filter(q => q.open !== null && q.high !== null && q.low !== null && q.close !== null && q.volume !== null)
          .map(q => ({
            date: new Date(q.date || Date.now()),
            open: q.open as number,
            high: q.high as number,
            low: q.low as number,
            close: q.close as number,
            volume: q.volume as number,
          }));

        const quote = await yahooFinance.quote(yahooSymbol);

        const response: HistoricalDataResponse = {
          symbol,
          bars,
          currentQuote: {
            price: quote.regularMarketPrice || bars[bars.length - 1]?.close || 0,
            previousClose: quote.regularMarketPreviousClose || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            dayHigh: quote.regularMarketDayHigh || 0,
            dayLow: quote.regularMarketDayLow || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
            name: quote.shortName || quote.longName || symbol,
          },
        };

        cache.set(cacheKey, { data: response, timestamp: Date.now() });
        results.push(response);
      } catch (error) {
        errors.push({ symbol, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      errors,
      total: results.length,
    });
  } catch (error) {
    console.error("[v0] Batch historical veri hatasi:", error);
    return NextResponse.json(
      { error: "Batch veri cekilemedi", details: String(error) },
      { status: 500 }
    );
  }
}
