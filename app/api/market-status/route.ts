import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Borsa İstanbul çalışma saatleri
const MARKET_OPEN_HOUR = 10;
const MARKET_OPEN_MINUTE = 0;
const MARKET_CLOSE_HOUR = 18;
const MARKET_CLOSE_MINUTE = 0;

// Türkiye saat dilimi
const TURKEY_TIMEZONE = "Europe/Istanbul";

function getTurkeyTime(): Date {
  const now = new Date();
  const turkeyTime = new Date(
    now.toLocaleString("en-US", { timeZone: TURKEY_TIMEZONE })
  );
  return turkeyTime;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Pazar veya Cumartesi
}

function isMarketOpen(): {
  isOpen: boolean;
  message: string;
  nextEvent: string;
  timeUntil: string;
} {
  const now = getTurkeyTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const marketOpen = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
  const marketClose = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;

  // Hafta sonu kontrolü
  if (isWeekend(now)) {
    const daysUntilMonday = now.getDay() === 0 ? 1 : 2;
    return {
      isOpen: false,
      message: "Borsa hafta sonu kapalı",
      nextEvent: "Pazartesi açılış",
      timeUntil: `${daysUntilMonday} gün`,
    };
  }

  // Piyasa açık mı?
  if (currentTime >= marketOpen && currentTime < marketClose) {
    const minutesUntilClose = marketClose - currentTime;
    const hoursUntil = Math.floor(minutesUntilClose / 60);
    const minsUntil = minutesUntilClose % 60;

    // Trading zamanı kontrolü (17:30 - kapanıştan 30dk önce)
    const tradingTime = (MARKET_CLOSE_HOUR - 1) * 60 + 30; // 17:30
    const isTradingTime = currentTime >= tradingTime && currentTime < marketClose;

    // Satış zamanı kontrolü (10:00'dan sonra)
    const sellStartTime = 10 * 60; // 10:00
    const isSellTime = currentTime >= sellStartTime;

    let message = "Borsa açık";
    if (isTradingTime) {
      message = "🔔 ALIM ZAMANI! Kapanışa yaklaşılıyor";
    } else if (isSellTime && currentTime < tradingTime) {
      message = "📈 SATIŞ TAKİP ZAMANI - %1 hedefi kontrol edin";
    }

    return {
      isOpen: true,
      message,
      nextEvent: "Kapanış",
      timeUntil: `${hoursUntil}sa ${minsUntil}dk`,
    };
  }

  // Piyasa kapalı
  if (currentTime < marketOpen) {
    const minutesUntilOpen = marketOpen - currentTime;
    const hoursUntil = Math.floor(minutesUntilOpen / 60);
    const minsUntil = minutesUntilOpen % 60;

    return {
      isOpen: false,
      message: "Borsa henüz açılmadı",
      nextEvent: "Açılış",
      timeUntil: `${hoursUntil}sa ${minsUntil}dk`,
    };
  }

  // Günlük kapanıştan sonra
  return {
    isOpen: false,
    message: "Borsa bugün kapandı",
    nextEvent: "Yarın açılış",
    timeUntil: "~16 saat",
  };
}

export async function GET() {
  const now = getTurkeyTime();
  const marketStatus = isMarketOpen();

  return NextResponse.json({
    ...marketStatus,
    currentTime: now.toLocaleTimeString("tr-TR"),
    currentDate: now.toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    timezone: TURKEY_TIMEZONE,
    tradingStrategy: {
      buyTime: "17:30 (Kapanıştan 30dk önce)",
      sellCondition: "Sabah 10:00'dan sonra %1 yükselişte sat",
    },
  });
}
