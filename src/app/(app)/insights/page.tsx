import type { Metadata } from "next";
import { Suspense } from "react";
import { getRequiredUserId } from "@/lib/auth/session";
import { getOrCreateInsightReport } from "@/lib/db/insight-reports";
import { PageHeader } from "@/components/ui/PageHeader";
import { InsightsShell } from "@/components/insights/InsightsShell";
import type { InsightPeriodType } from "@/lib/finance/periods";
import { periodKeyFromParams } from "@/lib/finance/periods";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";

export const metadata: Metadata = { title: "Insights" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parsePeriod(sp: Record<string, string | string[] | undefined>): {
  period: InsightPeriodType;
  periodKey: string;
} {
  const raw = typeof sp.period === "string" ? sp.period : "daily";
  const period = (["daily", "weekly", "monthly"].includes(raw) ? raw : "daily") as InsightPeriodType;

  const periodKey = periodKeyFromParams(period, {
    date: typeof sp.date === "string" ? sp.date : undefined,
    week: typeof sp.week === "string" ? sp.week : undefined,
    month: typeof sp.month === "string" ? sp.month : undefined,
  });

  return { period, periodKey };
}

async function InsightsContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const userId = await getRequiredUserId();
  const { period, periodKey } = parsePeriod(searchParams);
  const report = await getOrCreateInsightReport(userId, period, periodKey);

  return <InsightsShell report={report} period={period} periodKey={periodKey} />;
}

export default async function InsightsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader title="Insights" description="Personalized analysis of your finances" />
      <Suspense fallback={<PageSkeleton />}>
        <InsightsContent searchParams={sp} />
      </Suspense>
    </div>
  );
}
