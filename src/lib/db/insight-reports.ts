import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { InsightPeriod } from "@prisma/client";
import type { InsightPeriodType } from "@/lib/finance/periods";
import { buildPeriodSnapshot } from "@/lib/finance/snapshots";
import { generatePeriodInsights, buildSummaryText } from "@/lib/finance/insight-engine";
import type { Insight } from "@/lib/finance/insight-engine/types";
import type { PeriodSnapshot } from "@/lib/finance/snapshots";

function toPrismaPeriod(period: InsightPeriodType): InsightPeriod {
  return period.toUpperCase() as InsightPeriod;
}

export interface InsightReportData {
  id: string;
  period: InsightPeriodType;
  periodKey: string;
  facts: PeriodSnapshot;
  insights: Insight[];
  summaryText: string;
  generatedAt: Date;
}

export async function getInsightReport(
  userId: string,
  period: InsightPeriodType,
  periodKey: string
): Promise<InsightReportData | null> {
  const report = await prisma.insightReport.findUnique({
    where: {
      userId_period_periodKey: {
        userId,
        period: toPrismaPeriod(period),
        periodKey,
      },
    },
  });

  if (!report) return null;

  return {
    id: report.id,
    period,
    periodKey: report.periodKey,
    facts: report.facts as unknown as PeriodSnapshot,
    insights: report.insights as unknown as Insight[],
    summaryText: report.summaryText ?? "",
    generatedAt: report.generatedAt,
  };
}

export async function getOrCreateInsightReport(
  userId: string,
  period: InsightPeriodType,
  periodKey: string,
  timezone = "Asia/Kolkata",
  forceRegenerate = false
): Promise<InsightReportData> {
  if (!forceRegenerate) {
    const existing = await getInsightReport(userId, period, periodKey);
    if (existing) return existing;
  }

  const facts = await buildPeriodSnapshot(userId, period, periodKey, timezone);
  const insights = generatePeriodInsights(facts);
  const summaryText = buildSummaryText(facts, insights);

  const report = await prisma.insightReport.upsert({
    where: {
      userId_period_periodKey: {
        userId,
        period: toPrismaPeriod(period),
        periodKey,
      },
    },
    create: {
      userId,
      period: toPrismaPeriod(period),
      periodKey,
      facts: facts as object,
      insights: insights as object[],
      summaryText,
    },
    update: forceRegenerate
      ? {
          facts: facts as object,
          insights: insights as object[],
          summaryText,
          generatedAt: new Date(),
        }
      : {},
  });

  return {
    id: report.id,
    period,
    periodKey: report.periodKey,
    facts,
    insights,
    summaryText,
    generatedAt: report.generatedAt,
  };
}
