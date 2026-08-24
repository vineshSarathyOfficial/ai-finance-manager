import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  getDashboardSummary,
  getMonthlyTrend,
  getCategorySpend,
  getInsight,
} from "@/lib/db/dashboard";
import { getRecentTransactions } from "@/lib/db/transactions";
import { getRecurringSummary, getRecurringTransactions } from "@/actions/recurring";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { InsightBanner } from "@/components/dashboard/InsightBanner";
import { RecurringWidget } from "@/components/dashboard/RecurringWidget";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const userId = await getRequiredUserId();

  const [summary, trend, categorySpend, insight, recentTransactions, recurringSummary, recurringItems] =
    await Promise.all([
      getDashboardSummary(userId),
      getMonthlyTrend(userId, 6),
      getCategorySpend(userId),
      getInsight(userId),
      getRecentTransactions(userId, 8),
      getRecurringSummary(userId),
      getRecurringTransactions(userId),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 text-[var(--color-ink)]">Dashboard</h1>
        <p className="body-sm text-[var(--color-ink-muted)] mt-1">
          {new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric",
          }).format(new Date())}
        </p>
      </div>

      {insight && <InsightBanner message={insight} />}

      <SummaryCards summary={summary} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <MonthlyTrendChart data={trend} />
        </div>
        <div className="xl:col-span-2">
          <CategoryDonutChart data={categorySpend} />
        </div>
      </div>

      <RecentTransactions transactions={recentTransactions} />

      <RecurringWidget summary={recurringSummary} topItems={recurringItems.slice(0, 5)} />
    </div>
  );
}
