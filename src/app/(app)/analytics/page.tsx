import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  getMonthlyTrend,
  getCategorySpend,
  getNetWorthTrend,
  getDailySpendHeatmap,
  getTopMerchants,
} from "@/lib/db/dashboard";
import { prisma } from "@/lib/db/prisma";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { BarChart2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Spending patterns, trends, and insights across your transactions.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const userId = await getRequiredUserId();

  const [
    trend,
    categorySpend,
    monthlyCategoryData,
    netWorthTrend,
    dailyHeatmap,
    topMerchants,
  ] = await Promise.all([
    getMonthlyTrend(userId, 6),
    getCategorySpend(userId),
    getMonthlyCategoryBreakdown(userId),
    getNetWorthTrend(userId, 6),
    getDailySpendHeatmap(userId),
    getTopMerchants(userId, 6),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 text-[var(--color-ink)] flex items-center gap-2.5">
          <BarChart2 className="w-6 h-6 text-[var(--color-primary)]" />
          Analytics
        </h1>
        <p className="body-sm text-[var(--color-ink-muted)] mt-1">
          Spending patterns and trends across your transactions
        </p>
      </div>

      <AnalyticsCharts
        trend={trend}
        categorySpend={categorySpend}
        monthlyCategoryData={monthlyCategoryData}
        netWorthTrend={netWorthTrend}
        dailyHeatmap={dailyHeatmap}
        topMerchants={topMerchants}
      />
    </div>
  );
}

async function getMonthlyCategoryBreakdown(userId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      transactionDate: true,
      category: { select: { name: true } },
    },
  });

  // Group by month + category
  const map = new Map<string, Map<string, number>>();
  for (const t of transactions) {
    const monthKey = new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "2-digit",
    }).format(new Date(t.transactionDate));

    if (!map.has(monthKey)) map.set(monthKey, new Map());
    const catMap = map.get(monthKey)!;
    catMap.set(t.category.name, (catMap.get(t.category.name) || 0) + t.amount.toNumber());
  }

  return Array.from(map.entries()).map(([month, cats]) => ({
    month,
    ...Object.fromEntries(cats),
  }));
}
