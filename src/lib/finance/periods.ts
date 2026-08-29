import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export type InsightPeriodType = "daily" | "weekly" | "monthly" | "yearly";

export interface PeriodBounds {
  start: Date;
  end: Date;
  periodKey: string;
}

const DEFAULT_TZ = "Asia/Kolkata";

function zonedDate(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone);
}

function toUtcFromZoned(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

export function getTodayPeriodKey(timezone = DEFAULT_TZ): string {
  return format(zonedDate(new Date(), timezone), "yyyy-MM-dd");
}

export function getCurrentWeekKey(timezone = DEFAULT_TZ): string {
  const zoned = zonedDate(new Date(), timezone);
  const year = format(zoned, "yyyy");
  const week = format(zoned, "II");
  return `${year}-W${week}`;
}

export function getCurrentMonthKey(timezone = DEFAULT_TZ): string {
  return format(zonedDate(new Date(), timezone), "yyyy-MM");
}

export function parsePeriodKey(period: InsightPeriodType, key: string): Date {
  switch (period) {
    case "daily":
      return parseISO(key);
    case "weekly": {
      const match = key.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return new Date();
      const year = parseInt(match[1], 10);
      const week = parseInt(match[2], 10);
      const jan4 = new Date(year, 0, 4);
      const start = startOfWeek(jan4, { weekStartsOn: 1 });
      return addWeeks(start, week - 1);
    }
    case "monthly": {
      const [y, m] = key.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    case "yearly":
      return new Date(parseInt(key, 10), 0, 1);
    default:
      return new Date();
  }
}

export function getPeriodBounds(
  period: InsightPeriodType,
  refDate: Date,
  timezone = DEFAULT_TZ
): PeriodBounds {
  const zoned = zonedDate(refDate, timezone);

  switch (period) {
    case "daily": {
      const start = startOfDay(zoned);
      const end = endOfDay(zoned);
      return {
        start: toUtcFromZoned(start, timezone),
        end: toUtcFromZoned(end, timezone),
        periodKey: format(zoned, "yyyy-MM-dd"),
      };
    }
    case "weekly": {
      const start = startOfWeek(zoned, { weekStartsOn: 1 });
      const end = endOfWeek(zoned, { weekStartsOn: 1 });
      const year = format(zoned, "yyyy");
      const week = format(zoned, "II");
      return {
        start: toUtcFromZoned(start, timezone),
        end: toUtcFromZoned(end, timezone),
        periodKey: `${year}-W${week}`,
      };
    }
    case "monthly": {
      const start = startOfMonth(zoned);
      const end = endOfMonth(zoned);
      return {
        start: toUtcFromZoned(start, timezone),
        end: toUtcFromZoned(end, timezone),
        periodKey: format(zoned, "yyyy-MM"),
      };
    }
    case "yearly": {
      const start = new Date(zoned.getFullYear(), 0, 1);
      const end = new Date(zoned.getFullYear(), 11, 31, 23, 59, 59, 999);
      return {
        start: toUtcFromZoned(start, timezone),
        end: toUtcFromZoned(end, timezone),
        periodKey: String(zoned.getFullYear()),
      };
    }
  }
}

export function shiftPeriod(
  period: InsightPeriodType,
  periodKey: string,
  delta: number
): string {
  const ref = parsePeriodKey(period, periodKey);
  switch (period) {
    case "daily":
      return format(addDays(ref, delta), "yyyy-MM-dd");
    case "weekly":
      return getPeriodBounds("weekly", addWeeks(ref, delta)).periodKey;
    case "monthly":
      return format(addMonths(ref, delta), "yyyy-MM");
    case "yearly":
      return String(ref.getFullYear() + delta);
  }
}

export function formatPeriodLabel(period: InsightPeriodType, periodKey: string): string {
  const ref = parsePeriodKey(period, periodKey);
  switch (period) {
    case "daily":
      return format(ref, "MMM d, yyyy");
    case "weekly": {
      const end = endOfWeek(ref, { weekStartsOn: 1 });
      return `${format(ref, "MMM d")}–${format(end, "MMM d, yyyy")}`;
    }
    case "monthly":
      return format(ref, "MMMM yyyy");
    case "yearly":
      return periodKey;
  }
}

export function periodKeyFromParams(
  period: InsightPeriodType,
  params: { date?: string; week?: string; month?: string; year?: string },
  timezone = DEFAULT_TZ
): string {
  if (period === "daily" && params.date) return params.date;
  if (period === "weekly" && params.week) return params.week;
  if (period === "monthly" && params.month) return params.month;
  if (period === "yearly" && params.year) return params.year;

  switch (period) {
    case "daily":
      return getTodayPeriodKey(timezone);
    case "weekly":
      return getCurrentWeekKey(timezone);
    case "monthly":
      return getCurrentMonthKey(timezone);
    case "yearly":
      return String(zonedDate(new Date(), timezone).getFullYear());
  }
}

export function insightsUrl(period: InsightPeriodType, periodKey: string): string {
  switch (period) {
    case "daily":
      return `/insights?period=daily&date=${periodKey}`;
    case "weekly":
      return `/insights?period=weekly&week=${periodKey}`;
    case "monthly":
      return `/insights?period=monthly&month=${periodKey}`;
    case "yearly":
      return `/insights?period=yearly&year=${periodKey}`;
  }
}
