import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  getDashboardSummary,
  getMonthlyTrend,
  getCategorySpend,
  getCreditCardSummary,
} from "@/lib/db/dashboard";
import { getMonthOverMonthChange } from "@/lib/finance/metrics";
import { generateInsights } from "@/lib/finance/insights";
import { getRecentTransactions } from "@/lib/db/transactions";
import { getRecurringSummary, getRecurringTransactions } from "@/actions/recurring";
import { PageHeader } from "@/components/ui/PageHeader";
import { CashFlowHero } from "@/components/dashboard/CashFlowHero";
import { InsightsList } from "@/components/dashboard/InsightsList";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { RecurringWidget } from "@/components/dashboard/RecurringWidget";
import { CreditCardSummaryWidget } from "@/components/dashboard/CreditCardSummaryWidget";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UploadCloud } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const userId = await getRequiredUserId();

  const [summary, mom, trend, categorySpend, insights, recentTransactions, recurringSummary, recurringItems, ccSummary] =
    await Promise.all([
      getDashboardSummary(userId),
      getMonthOverMonthChange(userId),
      getMonthlyTrend(userId, 6),
      getCategorySpend(userId),
      generateInsights(userId, 3),
      getRecentTransactions(userId, 8),
      getRecurringSummary(userId),
      getRecurringTransactions(userId),
      getCreditCardSummary(userId),
    ]);

  const monthLabel = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={monthLabel}
        action={
          <Link href="/import" className="hidden sm:block">
            <Button variant="secondary" size="sm">
              <UploadCloud className="w-4 h-4" />
              Import
            </Button>
          </Link>
        }
      />

      <CashFlowHero summary={summary} expenseChange={mom.expenseChange} />

      {insights.length > 0 && <InsightsList insights={insights} compact />}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div className="xl:col-span-3 min-w-0">
          <MonthlyTrendChart data={trend} />
        </div>
        <div className="xl:col-span-2 min-w-0">
          <CategoryDonutChart data={categorySpend} />
        </div>
      </div>

      {ccSummary ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 min-w-0">
            <RecentTransactions transactions={recentTransactions} />
          </div>
          <div className="min-w-0">
            <CreditCardSummaryWidget summary={ccSummary} />
          </div>
        </div>
      ) : (
        <RecentTransactions transactions={recentTransactions} />
      )}
      <RecurringWidget summary={recurringSummary} topItems={recurringItems.slice(0, 5)} />
    </div>
  );
}
