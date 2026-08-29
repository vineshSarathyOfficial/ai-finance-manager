import Link from "next/link";
import { RotateCcw, TrendingDown, CalendarClock, ChevronRight, AlertTriangle } from "lucide-react";
import type { RecurringSummary } from "@/actions/recurring";
import type { Frequency } from "@/types/finance";

interface RecurringItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: Frequency;
  nextDueDate: Date | null;
}

interface Props {
  summary: RecurringSummary;
  topItems: RecurringItem[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(d));
}

function toMonthly(amount: number, freq: string) {
  switch (freq) {
    case "WEEKLY":    return amount * 52 / 12;
    case "BIWEEKLY":  return amount * 26 / 12;
    case "MONTHLY":   return amount;
    case "QUARTERLY": return amount / 3;
    case "YEARLY":    return amount / 12;
    default:          return amount;
  }
}

function isDueSoon(d: Date | null) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff < 7 * 86_400_000;
}

export function RecurringWidget({ summary, topItems }: Props) {
  if (summary.activeCount === 0) return null;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[var(--radius-lg)] overflow-hidden shadow-level-1">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-hairline)]">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="title text-[var(--color-ink)]">Recurring Payments</h2>
        </div>
        <Link
          href="/subscriptions"
          className="flex items-center gap-1 caption text-[var(--color-primary)] hover:underline"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Monthly cost + due alert */}
      <div className="px-5 py-4 flex flex-wrap items-center gap-4 border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[var(--color-ruby)]" />
          <div>
            <p className="caption text-[var(--color-ink-faint)]">Monthly recurring cost</p>
            <p className="heading-md body-tabular text-[var(--color-ink)]">
              {formatCurrency(summary.totalMonthlyExpense)}
            </p>
          </div>
        </div>

        {summary.dueThisWeek.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-warning-bg)] border border-[var(--color-hairline)] ml-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            <span className="caption text-[var(--color-warning)]">
              {summary.dueThisWeek.length} due this week
            </span>
          </div>
        )}
      </div>

      {/* Top items list */}
      <div className="divide-y divide-[var(--color-hairline)]">
        {topItems.map((item) => {
          const monthly = toMonthly(Number(item.amount), item.frequency);
          const dueSoon = isDueSoon(item.nextDueDate);

          return (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)]/8 flex items-center justify-center text-sm flex-shrink-0">
                🔄
              </div>
              <div className="flex-1 min-w-0">
                <p className="body-sm font-medium text-[var(--color-ink)] truncate">{item.name}</p>
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="w-3 h-3 text-[var(--color-ink-faint)]" />
                  <span className="caption text-[var(--color-ink-faint)]">
                    Next: {formatDate(item.nextDueDate)}
                  </span>
                  {dueSoon && (
                    <span className="caption text-[var(--color-warning)]">· Soon</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="body-sm body-tabular text-[var(--color-ink)]">
                  {formatCurrency(Number(item.amount))}
                </p>
                <p className="caption text-[var(--color-ink-faint)]">
                  ≈ {formatCurrency(monthly)}/mo
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
