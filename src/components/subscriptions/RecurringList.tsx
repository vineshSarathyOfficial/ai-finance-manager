"use client";

import { useState, useTransition } from "react";
import {
  RotateCcw,
  Trash2,
  ChevronDown,
  CalendarClock,
  TrendingDown,
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { toggleRecurringActiveAction, deleteRecurringAction } from "@/actions/recurring";
import type { Frequency } from "@/types/finance";

interface RecurringItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: Frequency;
  nextDueDate: Date | null;
  isActive: boolean;
  occurrences: number;
  confidence: number;
  category: { name: string; icon: string | null } | null;
}

interface Props {
  items: RecurringItem[];
}

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Bi-weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

const FREQ_BADGE_COLOR: Record<string, string> = {
  WEEKLY:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
  BIWEEKLY:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  MONTHLY:   "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20",
  QUARTERLY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  YEARLY:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function confidenceColor(n: number) {
  if (n >= 75) return "text-emerald-400";
  if (n >= 50) return "text-amber-400";
  return "text-red-400";
}

function toMonthly(amount: number, freq: string): number {
  switch (freq) {
    case "WEEKLY":    return amount * 52 / 12;
    case "BIWEEKLY":  return amount * 26 / 12;
    case "MONTHLY":   return amount;
    case "QUARTERLY": return amount / 3;
    case "YEARLY":    return amount / 12;
    default:          return amount;
  }
}

function isDueSoon(nextDueDate: Date | null): boolean {
  if (!nextDueDate) return false;
  const diff = new Date(nextDueDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 86_400_000;
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

export function RecurringList({ items }: Props) {
  const [filter, setFilter] = useState<"all" | "EXPENSE" | "INCOME">("all");
  const [freqFilter, setFreqFilter] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = items.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    if (freqFilter !== "all" && item.frequency !== freqFilter) return false;
    return true;
  });

  const handleToggle = (id: string, current: boolean) => {
    setLoadingId(id);
    startTransition(async () => {
      await toggleRecurringActiveAction(id, !current);
      toast.success(!current ? "Marked as active" : "Paused subscription");
      setLoadingId(null);
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from recurring list?`)) return;
    setLoadingId(id);
    startTransition(async () => {
      await deleteRecurringAction(id);
      toast.success("Removed from recurring list");
      setLoadingId(null);
    });
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--color-canvas-soft)] flex items-center justify-center mb-4">
          <RotateCcw className="w-6 h-6 text-[var(--color-ink-faint)]" />
        </div>
        <h3 className="title text-[var(--color-ink)] mb-1">No recurring transactions detected yet</h3>
        <p className="body-sm text-[var(--color-ink-muted)] max-w-sm">
          Click <strong>Scan Transactions</strong> above to automatically detect subscriptions, EMIs, and salary credits from your transaction history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "EXPENSE", "INCOME"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-[var(--radius-full)] caption font-medium border transition-all ${
              filter === v
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "border-[var(--color-hairline)] text-[var(--color-ink-muted)] hover:border-[var(--color-primary)]/40"
            }`}
          >
            {v === "all" ? "All" : v === "EXPENSE" ? "Expenses" : "Income"}
          </button>
        ))}
        <div className="relative">
          <select
            value={freqFilter}
            onChange={(e) => setFreqFilter(e.target.value)}
            className="pl-3 pr-7 py-1.5 rounded-[var(--radius-full)] caption border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] appearance-none cursor-pointer"
          >
            <option value="all">All frequencies</option>
            {Object.entries(FREQ_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] pointer-events-none" />
        </div>
        <span className="ml-auto caption text-[var(--color-ink-faint)]">
          {filtered.length} of {items.length}
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isLoading = loadingId === item.id && pending;
          const monthly = toMonthly(Number(item.amount), item.frequency);
          const dueSoon = isDueSoon(item.nextDueDate);

          return (
            <div
              key={item.id}
              className={`relative rounded-[var(--radius-xl)] border p-5 flex flex-col gap-3 transition-all ${
                item.isActive
                  ? "bg-[var(--color-surface)] border-[var(--color-hairline)]"
                  : "bg-[var(--color-canvas-soft)] border-[var(--color-hairline)] opacity-60"
              }`}
            >
              {/* Due soon badge */}
              {dueSoon && item.isActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-full)] bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="caption text-amber-400 font-medium">Due soon</span>
                </div>
              )}

              {/* Header */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-lg flex-shrink-0 ${
                    item.type === "INCOME"
                      ? "bg-emerald-500/10"
                      : "bg-[var(--color-primary)]/10"
                  }`}
                >
                  {item.category?.icon ?? (item.type === "INCOME" ? "💰" : "🔄")}
                </div>
                <div className="flex-1 min-w-0 pr-12">
                  <h3 className="font-semibold text-[var(--color-ink)] text-[14px] leading-snug line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="caption text-[var(--color-ink-faint)] mt-0.5">
                    {item.category?.name ?? "Uncategorized"}
                  </p>
                </div>
              </div>

              {/* Amount + frequency */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    {item.type === "INCOME" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    )}
                    <span className="font-bold text-[var(--color-ink)] text-[16px]">
                      {formatCurrency(Number(item.amount))}
                    </span>
                  </div>
                  <p className="caption text-[var(--color-ink-faint)] mt-0.5">
                    ≈ {formatCurrency(monthly)}/mo
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-[var(--radius-full)] caption font-medium border ${
                    FREQ_BADGE_COLOR[item.frequency] ?? "bg-[var(--color-canvas-soft)] text-[var(--color-ink-muted)] border-[var(--color-hairline)]"
                  }`}
                >
                  {FREQ_LABELS[item.frequency]}
                </span>
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between text-[12px] text-[var(--color-ink-faint)]">
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Next: {formatDate(item.nextDueDate)}
                </span>
                <span className={`font-medium ${confidenceColor(item.confidence)}`}>
                  {item.confidence}% confidence
                </span>
              </div>

              {/* Occurrences bar */}
              <div className="flex items-center gap-2 text-[12px] text-[var(--color-ink-faint)]">
                <span>{item.occurrences}× detected</span>
                <div className="flex-1 h-1 rounded-full bg-[var(--color-canvas-soft)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]/50 transition-all"
                    style={{ width: `${Math.min(item.confidence, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-hairline)]">
                <button
                  onClick={() => handleToggle(item.id, item.isActive)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[var(--radius-md)] caption font-medium border border-[var(--color-hairline)] hover:bg-[var(--color-canvas-soft)] transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : item.isActive ? (
                    <XCircle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {item.isActive ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.name)}
                  disabled={isLoading}
                  className="p-1.5 rounded-[var(--radius-md)] border border-[var(--color-hairline)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-[var(--color-ink-faint)] transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
