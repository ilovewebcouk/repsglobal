// Reporting-period helper for the admin Platform Overview.
// All boundaries computed in Europe/London civil time and returned as UTC ISO strings.

export type PeriodKey =
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_30d"
  | "mtd"
  | "prev_month"
  | "qtd"
  | "ytd"
  | "custom";

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "mtd", label: "Month to date" },
  { value: "prev_month", label: "Previous month" },
  { value: "qtd", label: "Quarter to date" },
  { value: "ytd", label: "Year to date" },
  { value: "custom", label: "Custom range" },
];

const TZ = "Europe/London";

function londonParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

// Returns the UTC Date corresponding to London midnight on the given Y-M-D.
function londonMidnightUtc(year: number, month: number, day: number): Date {
  // Build a UTC guess then adjust by the London offset at that instant.
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const p = londonParts(guess);
  const guessAsLondon = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offset = guessAsLondon - guess.getTime(); // ms ahead of UTC
  return new Date(guess.getTime() - offset);
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

export interface PeriodRange {
  from: string; // inclusive, ISO UTC
  to: string;   // exclusive, ISO UTC
  label: string;
}

export function resolvePeriod(
  key: PeriodKey,
  custom?: { from?: string; to?: string },
  now: Date = new Date(),
): PeriodRange {
  const today = londonParts(now);
  const todayStart = londonMidnightUtc(today.year, today.month, today.day);
  const tomorrowStart = addDays(todayStart, 1);

  const opt = PERIOD_OPTIONS.find((o) => o.value === key);
  const label = opt?.label ?? "Last 30 days";

  switch (key) {
    case "today":
      return { from: todayStart.toISOString(), to: tomorrowStart.toISOString(), label };
    case "yesterday":
      return { from: addDays(todayStart, -1).toISOString(), to: todayStart.toISOString(), label };
    case "last_7d":
      return { from: addDays(todayStart, -7).toISOString(), to: tomorrowStart.toISOString(), label };
    case "last_30d":
      return { from: addDays(todayStart, -30).toISOString(), to: tomorrowStart.toISOString(), label };
    case "mtd": {
      const start = londonMidnightUtc(today.year, today.month, 1);
      return { from: start.toISOString(), to: tomorrowStart.toISOString(), label };
    }
    case "prev_month": {
      const prevMonth = today.month === 1 ? 12 : today.month - 1;
      const prevYear = today.month === 1 ? today.year - 1 : today.year;
      const start = londonMidnightUtc(prevYear, prevMonth, 1);
      const end = londonMidnightUtc(today.year, today.month, 1);
      return { from: start.toISOString(), to: end.toISOString(), label };
    }
    case "qtd": {
      const qStartMonth = Math.floor((today.month - 1) / 3) * 3 + 1;
      const start = londonMidnightUtc(today.year, qStartMonth, 1);
      return { from: start.toISOString(), to: tomorrowStart.toISOString(), label };
    }
    case "ytd": {
      const start = londonMidnightUtc(today.year, 1, 1);
      return { from: start.toISOString(), to: tomorrowStart.toISOString(), label };
    }
    case "custom": {
      const from = custom?.from ?? addDays(todayStart, -30).toISOString();
      const to = custom?.to ?? tomorrowStart.toISOString();
      return { from, to, label: "Custom range" };
    }
  }
}

export function forecastWindow(now: Date = new Date()): PeriodRange {
  const today = londonParts(now);
  const todayStart = londonMidnightUtc(today.year, today.month, today.day);
  return {
    from: now.toISOString(),
    to: addDays(todayStart, 30).toISOString(),
    label: "Next 30 days",
  };
}

// Forecast horizon (independent of the historical period selector).
// MUST NOT share its window with revenue/members/growth KPIs.
import type { ForecastHorizon } from "./metrics-definitions";

export function forecastWindowFor(
  horizon: ForecastHorizon,
  custom?: { from?: string; to?: string },
  now: Date = new Date(),
): PeriodRange {
  const today = londonParts(now);
  const todayStart = londonMidnightUtc(today.year, today.month, today.day);
  const fromNowIso = now.toISOString();
  switch (horizon) {
    case "next_30d":
      return {
        from: fromNowIso,
        to: addDays(todayStart, 30).toISOString(),
        label: "Next 30 days",
      };
    case "remaining_this_month": {
      const nextMonth =
        today.month === 12
          ? londonMidnightUtc(today.year + 1, 1, 1)
          : londonMidnightUtc(today.year, today.month + 1, 1);
      return {
        from: fromNowIso,
        to: nextMonth.toISOString(),
        label: "Remaining this month",
      };
    }
    case "next_month": {
      const nextMonthStart =
        today.month === 12
          ? londonMidnightUtc(today.year + 1, 1, 1)
          : londonMidnightUtc(today.year, today.month + 1, 1);
      const monthAfter =
        today.month >= 11
          ? londonMidnightUtc(today.year + 1, today.month - 10, 1)
          : londonMidnightUtc(today.year, today.month + 2, 1);
      return {
        from: nextMonthStart.toISOString(),
        to: monthAfter.toISOString(),
        label: "Next month",
      };
    }
    case "current_quarter": {
      const qStartMonth = Math.floor((today.month - 1) / 3) * 3 + 1;
      const qEndMonth = qStartMonth + 3;
      const end =
        qEndMonth > 12
          ? londonMidnightUtc(today.year + 1, qEndMonth - 12, 1)
          : londonMidnightUtc(today.year, qEndMonth, 1);
      return {
        from: fromNowIso,
        to: end.toISOString(),
        label: "Current quarter",
      };
    }
    case "current_year": {
      const end = londonMidnightUtc(today.year + 1, 1, 1);
      return {
        from: fromNowIso,
        to: end.toISOString(),
        label: "Current year",
      };
    }
    case "custom": {
      const from = custom?.from ?? fromNowIso;
      const to = custom?.to ?? addDays(todayStart, 30).toISOString();
      return { from, to, label: "Custom range" };
    }
  }
}

// Enumerate London-civil days in [from, to) for series scaffolding.
export function enumerateDays(fromIso: string, toIso: string): string[] {
  const fromD = new Date(fromIso);
  const toD = new Date(toIso);
  const fp = londonParts(fromD);
  const tp = londonParts(toD);
  const start = londonMidnightUtc(fp.year, fp.month, fp.day);
  const end = londonMidnightUtc(tp.year, tp.month, tp.day);
  const out: string[] = [];
  for (let d = start; d < end; d = addDays(d, 1)) {
    const p = londonParts(d);
    out.push(`${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`);
    if (out.length > 400) break; // safety
  }
  return out;
}

export function londonDayKey(iso: string): string {
  const p = londonParts(new Date(iso));
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
