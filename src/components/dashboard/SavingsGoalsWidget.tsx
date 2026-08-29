import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { PiggyBank, ChevronRight } from "lucide-react";
import type { SavingsGoalItem } from "@/components/goals/GoalsClient";

export function SavingsGoalsWidget({ goals }: { goals: SavingsGoalItem[] }) {
  if (goals.length === 0) return null;

  const topGoals = goals.slice(0, 3);

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="title text-[var(--color-ink)]">Savings Goals</h2>
        </div>
        <Link href="/goals" className="flex items-center gap-1 caption text-[var(--color-primary)] hover:underline">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-4">
        {topGoals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="body-sm text-[var(--color-ink)]">
                  {goal.icon ?? "🎯"} {goal.name}
                </span>
                <span className="caption text-[var(--color-ink-muted)]">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-canvas-soft)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
              </div>
              <p className="caption text-[var(--color-ink-faint)] mt-1">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
