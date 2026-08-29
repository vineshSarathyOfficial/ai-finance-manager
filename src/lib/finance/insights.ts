import { getOrCreateInsightReport } from "@/lib/db/insight-reports";
import { getCurrentMonthKey } from "@/lib/finance/periods";

export type { Insight } from "@/lib/finance/insight-engine/types";

export async function generateInsights(userId: string, limit = 10) {
  const report = await getOrCreateInsightReport(userId, "monthly", getCurrentMonthKey());
  return report.insights.slice(0, limit);
}

export async function getTopInsight(userId: string) {
  const insights = await generateInsights(userId, 1);
  return insights[0] ?? null;
}
