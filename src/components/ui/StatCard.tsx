import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  format?: "currency" | "percent" | "number" | "text";
  change?: { value: number; label?: string };
  icon?: LucideIcon;
  href?: string;
  className?: string;
  variant?: "default" | "income" | "expense" | "primary";
}

const variantStyles = {
  default: {
    value: "text-[var(--color-ink)]",
    icon: "bg-[var(--color-canvas-soft)] text-[var(--color-ink-muted)]",
  },
  income: {
    value: "text-[var(--color-income)]",
    icon: "bg-[var(--color-income-bg)] text-[var(--color-accent-green)]",
  },
  expense: {
    value: "text-[var(--color-ink)]",
    icon: "bg-[var(--color-expense-bg)] text-[var(--color-ink-muted)]",
  },
  primary: {
    value: "text-[var(--color-primary)]",
    icon: "bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)]",
  },
};

export function StatCard({
  label,
  value,
  format = "text",
  change,
  icon: Icon,
  href,
  className,
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant];

  const formatted =
    format === "currency" && typeof value === "number"
      ? formatCurrency(value)
      : format === "percent" && typeof value === "number"
        ? `${value}%`
        : String(value);

  const content = (
    <div
      className={cn(
        "bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-3.5 sm:p-5 lg:p-6 flex flex-col gap-1.5 sm:gap-2 min-w-0 transition-shadow",
        href && "hover:shadow-level-1 cursor-pointer",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="caption text-[var(--color-ink-muted)]">{label}</span>
        {Icon && (
          <div className={cn("w-7 h-7 sm:w-9 sm:h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0", styles.icon)}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>
      <p className={cn("heading-2 tabular-nums break-words leading-tight", styles.value)}>{formatted}</p>
      {change && (
        <p
          className={cn(
            "caption tabular-nums",
            change.value > 0
              ? "text-[var(--color-accent-orange-deep)]"
              : change.value < 0
                ? "text-[var(--color-accent-green)]"
                : "text-[var(--color-ink-muted)]"
          )}
        >
          {change.value > 0 ? "+" : ""}
          {change.value}% {change.label ?? "vs last month"}
        </p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
