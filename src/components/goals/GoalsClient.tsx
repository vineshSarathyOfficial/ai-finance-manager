"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import {
  createSavingsGoalAction,
  deleteSavingsGoalAction,
  updateSavingsGoalAction,
} from "@/actions/goals";
import { formatDateInput } from "@/lib/utils";

export interface SavingsGoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  icon: string | null;
}

export function GoalsClient({ goals: initialGoals }: { goals: SavingsGoalItem[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoalItem | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const result = await createSavingsGoalAction(new FormData(e.currentTarget));
    setPending(false);
    if (result.success) {
      toast.success(result.message);
      setShowCreate(false);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editGoal) return;
    setPending(true);
    const result = await updateSavingsGoalAction(editGoal.id, new FormData(e.currentTarget));
    setPending(false);
    if (result.success) {
      toast.success(result.message);
      setEditGoal(null);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteSavingsGoalAction(id);
    if (result.success) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast.success(result.message);
      router.refresh();
    }
  };

  const GoalForm = ({
    goal,
    onSubmit,
    onCancel,
  }: {
    goal?: SavingsGoalItem;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Name</label>
        <input name="name" defaultValue={goal?.name} required className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] body-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Target (₹)</label>
          <input name="targetAmount" type="number" step="0.01" min="1" defaultValue={goal?.targetAmount} required className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] body-sm" />
        </div>
        <div>
          <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Saved (₹)</label>
          <input name="currentAmount" type="number" step="0.01" min="0" defaultValue={goal?.currentAmount ?? 0} className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] body-sm" />
        </div>
      </div>
      <div>
        <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Target date (optional)</label>
        <input name="targetDate" type="date" defaultValue={goal?.targetDate ? formatDateInput(goal.targetDate) : ""} className="w-full px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] body-sm" />
      </div>
      <div>
        <label className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">Icon (optional)</label>
        <input name="icon" type="text" maxLength={2} defaultValue={goal?.icon ?? "🎯"} className="w-16 px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] body-sm text-center" />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      </div>
    </form>
  );

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card padding="lg" className="text-center">
          <PiggyBank className="w-10 h-10 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="body-sm text-[var(--color-ink-muted)]">No savings goals yet. Set a target to track your progress.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return (
              <Card key={goal.id} padding="md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{goal.icon ?? "🎯"}</span>
                    <div>
                      <p className="title-md text-[var(--color-ink)]">{goal.name}</p>
                      <p className="caption text-[var(--color-ink-muted)]">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditGoal(goal)} className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-primary)]">Edit</button>
                    <button onClick={() => handleDelete(goal.id)} className="p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-error)]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-canvas-soft)] overflow-hidden mb-2">
                  <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="caption text-[var(--color-ink-faint)]">{pct}% complete</p>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={showCreate} onClose={() => setShowCreate(false)} title="New Savings Goal">
        <GoalForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Sheet>

      <Sheet open={!!editGoal} onClose={() => setEditGoal(null)} title="Edit Goal">
        {editGoal && <GoalForm goal={editGoal} onSubmit={handleUpdate} onCancel={() => setEditGoal(null)} />}
      </Sheet>
    </>
  );
}
