import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  getMonthlyTrend,
  getCategorySpend,
  getNetWorthTrend,
  getDailySpendHeatmap,
  getTopMerchants,
  getCategoryMonthOverMonth,
  getAccountSpending,
  getDashboardSummary,
} from "@/lib/db/dashboard";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Spending patterns, trends, and insights across your transactions.",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const sp = await searchParams;

  const [
    trend, categorySpend, categoryMoM, netWorthTrend,
    dailyHeatmap, topMerchants, accountSpending, summary,
  ] = await Promise.all([
    getMonthlyTrend(userId, 6),
    getCategorySpend(userId),
    getCategoryMonthOverMonth(userId),
    getNetWorthTrend(userId, 6),
    getDailySpendHeatmap(userId),
    getTopMerchants(userId, 10),
    getAccountSpending(userId),
    getDashboardSummary(userId),
  ]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Analytics"
        description="Spending patterns and trends across your transactions"
      />

      <AnalyticsCharts
        trend={trend}
        categorySpend={categorySpend}
        categoryMoM={categoryMoM}
        netWorthTrend={netWorthTrend}
        dailyHeatmap={dailyHeatmap}
        topMerchants={topMerchants}
        accountSpending={accountSpending}
        summary={summary}
        initialTab={typeof sp.tab === "string" ? sp.tab : undefined}
      />
    </div>
  );
}
