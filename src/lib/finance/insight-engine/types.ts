import type { InsightPeriodType } from "../periods";
import type { PeriodSnapshot } from "../snapshots";

export interface Insight {
  id: string;
  type: string;
  period: InsightPeriodType;
  periodKey: string;
  title: string;
  message: string;
  href: string;
  severity: "info" | "warning" | "positive";
  priority: number;
  value?: number;
  category?: string;
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
