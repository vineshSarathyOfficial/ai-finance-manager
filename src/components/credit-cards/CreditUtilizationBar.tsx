import { cn } from "@/lib/utils";
import { getUtilizationLevel } from "@/lib/finance/credit-card-utils";

interface CreditUtilizationBarProps {
  utilizationPct: number | null;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Utilization thresholds:
 * - 0–29.9%: low (neutral)
 * - 30–69.9%: moderate (warning)
 * - 70%+: high (error)
 */
export function CreditUtilizationBar({
  utilizationPct,
  label,
  showLabel = true,
  className,
}: CreditUtilizationBarProps) {
  const level = getUtilizationLevel(utilizationPct);
  const pct = utilizationPct ?? 0;
  const width = utilizationPct != null ? Math.min(pct, 100) : 0;

  const barColor =
    level === "high"
      ? "bg-[var(--color-error)]"
      : level === "moderate"
        ? "bg-[var(--color-warning)]"
        : "bg-[var(--color-primary)]";

  const textColor =
    level === "high"
      ? "text-[var(--color-error)]"
      : level === "moderate"
        ? "text-[var(--color-warning)]"
        : "text-[var(--color-ink-muted)]";

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <span className="caption text-[var(--color-ink-muted)]">
            {label ?? "Credit utilization"}
          </span>
          <span className={cn("caption font-medium body-tabular", textColor)}>
            {utilizationPct != null ? `${utilizationPct}% used` : "—"}
          </span>
        </div>
      )}
      <div className="h-2 bg-[var(--color-canvas-soft)] rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
