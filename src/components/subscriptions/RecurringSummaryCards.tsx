import { CalendarClock, TrendingDown, TrendingUp, RotateCcw, AlertTriangle } from "lucide-react";
import type { RecurringSummary } from "@/actions/recurring";

interface Props {
  summary: RecurringSummary;
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
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(d));
}

export function RecurringSummaryCards({ summary }: Props) {
  const cards = [
    {
      label: "Monthly Recurring Cost",
      value: formatCurrency(summary.totalMonthlyExpense),
      sub: `${summary.activeCount} active subscription${summary.activeCount !== 1 ? "s" : ""}`,
      icon: TrendingDown,
      iconColor: "text-[var(--color-ruby)]",
      bg: "bg-[var(--color-error-bg)]",
      gradient: "from-[var(--color-ruby)]/5 to-transparent",
    },
    {
      label: "Monthly Recurring Income",
      value: formatCurrency(summary.totalMonthlyIncome),
      sub: "Salary, freelance & regular credits",
      icon: TrendingUp,
      iconColor: "text-[var(--color-income)]",
      bg: "bg-[var(--color-income-bg)]",
      gradient: "from-[var(--color-income)]/5 to-transparent",
    },
    {
      label: "Active Recurring",
      value: summary.activeCount.toString(),
      sub: "subscriptions & recurring payments",
      icon: RotateCcw,
      iconColor: "text-[var(--color-primary)]",
      bg: "bg-[var(--color-success-bg)]",
      gradient: "from-[var(--color-primary)]/5 to-transparent",
    },
    {
      label: "Due This Week",
      value: summary.dueThisWeek.length.toString(),
      sub:
        summary.dueThisWeek.length > 0
          ? summary.dueThisWeek
              .map((d) => `${d.name.split(" ")[0]} (${formatDate(d.nextDueDate)})`)
              .slice(0, 2)
              .join(", ") + (summary.dueThisWeek.length > 2 ? "…" : "")
          : "No payments due soon",
      icon: CalendarClock,
      iconColor: summary.dueThisWeek.length > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-ink-faint)]",
      bg: summary.dueThisWeek.length > 0 ? "bg-[var(--color-warning-bg)]" : "bg-[var(--color-canvas-soft)]",
      gradient: summary.dueThisWeek.length > 0 ? "from-[var(--color-warning)]/5 to-transparent" : "from-transparent to-transparent",
      alert: summary.dueThisWeek.length > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {cards.map(({ label, value, sub, icon: Icon, iconColor, bg, gradient, alert }) => (
        <div
          key={label}
          className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-surface)] p-3.5 sm:p-5 shadow-level-1"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />
          <div className="relative">
            <div className={`w-9 h-9 rounded-[var(--radius-md)] ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
            </div>
            <div className="flex items-start gap-1">
              <p className="heading-md body-tabular text-[var(--color-ink)] leading-tight break-words">{value}</p>
              {alert && <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] mt-0.5 flex-shrink-0" />}
            </div>
            <p className="caption text-[var(--color-ink-muted)] mt-1">{label}</p>
            <p className="caption text-[var(--color-ink-faint)] mt-0.5 line-clamp-2">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
