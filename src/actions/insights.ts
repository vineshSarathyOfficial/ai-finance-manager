"use server";

import { getRequiredUserId } from "@/lib/auth/session";
import { getOrCreateInsightReport, getInsightReport } from "@/lib/db/insight-reports";
import type { InsightPeriodType } from "@/lib/finance/periods";
import { getCurrentMonthKey } from "@/lib/finance/periods";

export async function getInsightReportAction(period: InsightPeriodType, periodKey: string) {
  const userId = await getRequiredUserId();
  return getOrCreateInsightReport(userId, period, periodKey);
}

export async function regenerateInsightReportAction(period: InsightPeriodType, periodKey: string) {
  const userId = await getRequiredUserId();
  return getOrCreateInsightReport(userId, period, periodKey, "Asia/Kolkata", true);
}

export async function getLatestMonthlyInsightsAction() {
  const userId = await getRequiredUserId();
  const report = await getInsightReport(userId, "monthly", getCurrentMonthKey());
  return report?.insights ?? [];
}
