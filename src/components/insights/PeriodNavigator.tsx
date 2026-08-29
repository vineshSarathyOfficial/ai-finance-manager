"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsightPeriodType } from "@/lib/finance/periods";
import { formatPeriodLabel, shiftPeriod } from "@/lib/finance/periods";

interface PeriodNavigatorProps {
  period: InsightPeriodType;
  periodKey: string;
  onNavigate: (period: InsightPeriodType, periodKey: string) => void;
  canGoNext?: boolean;
}

export function PeriodNavigator({
  period,
  periodKey,
  onNavigate,
  canGoNext = false,
}: PeriodNavigatorProps) {
  const label = formatPeriodLabel(period, periodKey);

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <button
        type="button"
        onClick={() => onNavigate(period, shiftPeriod(period, periodKey, -1))}
        className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors"
        aria-label="Previous period"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="title-sm text-[var(--color-ink)] text-center flex-1 truncate">{label}</span>
      <button
        type="button"
        onClick={() => canGoNext && onNavigate(period, shiftPeriod(period, periodKey, 1))}
        disabled={!canGoNext}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-hairline)] transition-colors",
          canGoNext
            ? "text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)]"
            : "text-[var(--color-ink-faint)] opacity-50 cursor-not-allowed"
        )}
        aria-label="Next period"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
