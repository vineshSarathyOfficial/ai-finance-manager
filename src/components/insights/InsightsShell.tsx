"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { PeriodNavigator } from "./PeriodNavigator";
import { InsightHero } from "./InsightHero";
import { InsightMetricsGrid } from "./InsightMetricsGrid";
import { InsightObservations } from "./InsightObservations";
import { InsightTransactions } from "./InsightTransactions";
import { InsightCharts } from "./InsightCharts";
import { InsightBudgetSection } from "./InsightBudgetSection";
import { InsightRecurringSection } from "./InsightRecurringSection";
import { InsightCreditCardSection } from "./InsightCreditCardSection";
import type { InsightPeriodType } from "@/lib/finance/periods";
import {
  getCurrentMonthKey,
  getCurrentWeekKey,
  getTodayPeriodKey,
  periodKeyFromParams,
} from "@/lib/finance/periods";
import type { InsightReportData } from "@/lib/db/insight-reports";

const PERIOD_TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

interface InsightsShellProps {
  report: InsightReportData;
  period: InsightPeriodType;
  periodKey: string;
}

function buildUrl(period: InsightPeriodType, periodKey: string) {
  const params = new URLSearchParams({ period });
  if (period === "daily") params.set("date", periodKey);
  else if (period === "weekly") params.set("week", periodKey);
  else if (period === "monthly") params.set("month", periodKey);
  return `/insights?${params.toString()}`;
}

function isCurrentPeriod(period: InsightPeriodType, periodKey: string) {
  switch (period) {
    case "daily":
      return periodKey === getTodayPeriodKey();
    case "weekly":
      return periodKey === getCurrentWeekKey();
    case "monthly":
      return periodKey === getCurrentMonthKey();
    default:
      return false;
  }
}

export function InsightsShell({ report, period, periodKey }: InsightsShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (nextPeriod: InsightPeriodType, nextKey: string) => {
      router.push(buildUrl(nextPeriod, nextKey));
    },
    [router]
  );

  const handleTabChange = (tabId: string) => {
    const p = tabId as InsightPeriodType;
    const key = periodKeyFromParams(p, {
      date: searchParams.get("date") ?? undefined,
      week: searchParams.get("week") ?? undefined,
      month: searchParams.get("month") ?? undefined,
    });
    router.push(buildUrl(p, key));
  };

  const { facts: snapshot, insights, summaryText } = report;

  return (
    <div className="space-y-4 sm:space-y-5">
      <Tabs tabs={PERIOD_TABS} activeTab={period} onChange={handleTabChange} />

      <TabPanel active id={period}>
        <PeriodNavigator
          period={period}
          periodKey={periodKey}
          onNavigate={navigate}
          canGoNext={isCurrentPeriod(period, periodKey) ? false : true}
        />

        {!snapshot.hasEnoughData ? (
          <div className="text-center py-12">
            <p className="title text-[var(--color-ink)] mb-2">No activity in this period</p>
            <p className="body-sm text-[var(--color-ink-muted)]">
              Add or import transactions to unlock insights for this {period === "daily" ? "day" : period}.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <InsightHero summaryText={summaryText} snapshot={snapshot} />
            <InsightMetricsGrid snapshot={snapshot} />
            <InsightObservations insights={insights} />
            <InsightCharts snapshot={snapshot} />
            <InsightBudgetSection budgetItems={snapshot.budgetItems} />
            <InsightRecurringSection items={snapshot.recurringItems} total={snapshot.recurringTotal} />
            <InsightCreditCardSection creditCard={snapshot.creditCard} />
            <InsightTransactions
              transactions={snapshot.transactions}
              dateFrom={snapshot.dateFrom}
              dateTo={snapshot.dateTo}
            />
          </div>
        )}
      </TabPanel>
    </div>
  );
}
