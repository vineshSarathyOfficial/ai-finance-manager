"use client";

import dynamic from "next/dynamic";
import type { PeriodSnapshot } from "@/lib/finance/snapshots";

const WeeklyBarChart = dynamic(() => import("./WeeklyBarChart").then((m) => m.WeeklyBarChart), {
  ssr: false,
  loading: () => <div className="h-40 bg-[var(--color-canvas-soft)] rounded-[var(--radius-lg)] animate-pulse" />,
});

const CategoryMiniChart = dynamic(() => import("./CategoryMiniChart").then((m) => m.CategoryMiniChart), {
  ssr: false,
  loading: () => <div className="h-40 bg-[var(--color-canvas-soft)] rounded-[var(--radius-lg)] animate-pulse" />,
});

interface InsightChartsProps {
  snapshot: PeriodSnapshot;
}

export function InsightCharts({ snapshot }: InsightChartsProps) {
  if (snapshot.period === "weekly" && snapshot.dailyTrend.some((d) => d.expenses > 0)) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4">
        <h2 className="title text-[var(--color-ink)] mb-3">Daily spending</h2>
        <WeeklyBarChart data={snapshot.dailyTrend} />
      </div>
    );
  }

  if (snapshot.period === "monthly" && snapshot.categories.length > 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4">
        <h2 className="title text-[var(--color-ink)] mb-3">By category</h2>
        <CategoryMiniChart data={snapshot.categories.slice(0, 6)} />
      </div>
    );
  }

  return null;
}
