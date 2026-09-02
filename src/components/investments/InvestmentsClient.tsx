"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, TrendingUp, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { InvestmentFormModal } from "./InvestmentFormModal";
import {
  deleteInvestmentAction,
  updateInvestmentValueAction,
} from "@/actions/investments";
import {
  INVESTMENT_TYPE_LABELS,
  type InvestmentSummary,
  type InvestmentType,
  type SerializedInvestment,
} from "@/types/investment";

interface InvestmentsClientProps {
  investments: SerializedInvestment[];
  summary: InvestmentSummary;
}

const TYPE_ORDER: InvestmentType[] = ["SIP", "EPFO", "LUMP_SUM", "FD", "OTHER"];

function gainColor(gain: number | null) {
  if (gain == null) return "text-[var(--color-ink-muted)]";
  if (gain > 0) return "text-[var(--color-income)]";
  if (gain < 0) return "text-[var(--color-error)]";
  return "text-[var(--color-ink-muted)]";
}

export function InvestmentsClient({ investments, summary }: InvestmentsClientProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<SerializedInvestment | null>(null);
  const [valueUpdate, setValueUpdate] = useState<SerializedInvestment | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    items: investments.filter((i) => i.type === type),
  })).filter((g) => g.items.length > 0);

  const handleDelete = async (id: string) => {
    const result = await deleteInvestmentAction(id);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const handleQuickUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!valueUpdate) return;
    setPending(true);
    const result = await updateInvestmentValueAction(new FormData(e.currentTarget));
    setPending(false);
    if (result.success) {
      toast.success(result.message);
      setValueUpdate(null);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const InvestmentCard = ({ item }: { item: SerializedInvestment }) => {
    const gain =
      item.investedAmount != null && item.investedAmount > 0
        ? item.currentValue - item.investedAmount
        : null;
    const monthly =
      (item.monthlyContribution ?? 0) + (item.employerContribution ?? 0);

    return (
      <Card key={item.id} padding="md" className={!item.isActive ? "opacity-60" : undefined}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="body-sm font-medium text-[var(--color-ink)]">{item.name}</p>
              {!item.isActive && <Badge variant="muted">Inactive</Badge>}
            </div>
            {item.institution && (
              <p className="caption text-[var(--color-ink-muted)]">{item.institution}</p>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setValueUpdate(item)}
              className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-canvas-soft)]"
              aria-label="Update value"
            >
              <RefreshCw className="w-4 h-4 text-[var(--color-primary)]" />
            </button>
            <button
              type="button"
              onClick={() => setEditItem(item)}
              className="p-2 rounded-[var(--color-canvas-soft)]"
              aria-label="Edit"
            >
              <Pencil className="w-4 h-4 text-[var(--color-ink-muted)]" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-canvas-soft)]"
              aria-label="Delete"
            >
              <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
            </button>
          </div>
        </div>

        <p className="text-xl font-semibold body-tabular text-[var(--color-ink)]">
          {formatCurrency(item.currentValue)}
        </p>

        <div className="grid grid-cols-2 gap-2 mt-3">
          {item.investedAmount != null && (
            <div>
              <p className="caption text-[var(--color-ink-muted)]">Invested</p>
              <p className="body-sm body-tabular">{formatCurrency(item.investedAmount)}</p>
            </div>
          )}
          {gain != null && (
            <div>
              <p className="caption text-[var(--color-ink-muted)]">Gain / loss</p>
              <p className={`body-sm body-tabular ${gainColor(gain)}`}>
                {gain >= 0 ? "+" : ""}
                {formatCurrency(gain)}
              </p>
            </div>
          )}
          {monthly > 0 && (
            <div>
              <p className="caption text-[var(--color-ink-muted)]">Monthly</p>
              <p className="body-sm body-tabular">{formatCurrency(monthly)}</p>
            </div>
          )}
          {item.lastValueUpdate && (
            <div>
              <p className="caption text-[var(--color-ink-muted)]">Updated</p>
              <p className="body-sm">{formatDate(item.lastValueUpdate)}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card padding="md">
          <p className="caption text-[var(--color-ink-muted)]">Portfolio value</p>
          <p className="text-lg font-semibold body-tabular">{formatCurrency(summary.totalValue)}</p>
        </Card>
        <Card padding="md">
          <p className="caption text-[var(--color-ink-muted)]">Total invested</p>
          <p className="text-lg font-semibold body-tabular">
            {summary.totalInvested > 0 ? formatCurrency(summary.totalInvested) : "—"}
          </p>
        </Card>
        <Card padding="md">
          <p className="caption text-[var(--color-ink-muted)]">Monthly commitment</p>
          <p className="text-lg font-semibold body-tabular">
            {formatCurrency(summary.monthlyCommitment)}
          </p>
          <p className="caption text-[var(--color-ink-faint)]">
            {summary.sipCount} SIP{summary.sipCount !== 1 ? "s" : ""}
            {summary.epfoCount > 0 ? ` · ${summary.epfoCount} EPFO` : ""}
          </p>
        </Card>
        <Card padding="md">
          <p className="caption text-[var(--color-ink-muted)]">Overall gain</p>
          <p className={`text-lg font-semibold body-tabular ${gainColor(summary.gainLoss)}`}>
            {summary.gainLoss != null
              ? `${summary.gainLoss >= 0 ? "+" : ""}${formatCurrency(summary.gainLoss)}`
              : "—"}
          </p>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Investment
        </Button>
      </div>

      {investments.length === 0 ? (
        <Card padding="lg" className="text-center">
          <TrendingUp className="w-10 h-10 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="body-sm text-[var(--color-ink-muted)] mb-4">
            Track SIPs, EPFO, FDs and other investments in one place.
          </p>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add your first investment
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, items }) => (
            <section key={type}>
              <h2 className="title-md text-[var(--color-ink)] mb-3">
                {INVESTMENT_TYPE_LABELS[type]}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <InvestmentCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <InvestmentFormModal open={showAdd} onClose={() => setShowAdd(false)} />
      <InvestmentFormModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        investment={editItem ?? undefined}
      />

      <Sheet
        open={!!valueUpdate}
        onClose={() => setValueUpdate(null)}
        title={`Update value — ${valueUpdate?.name}`}
      >
        {valueUpdate && (
          <form onSubmit={handleQuickUpdate} className="space-y-4">
            <input type="hidden" name="id" value={valueUpdate.id} />
            <div>
              <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">
                Current value (₹)
              </label>
              <input
                name="currentValue"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={valueUpdate.currentValue}
                className="w-full h-11 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm"
              />
            </div>
            <div>
              <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">
                Total invested (₹)
              </label>
              <input
                name="investedAmount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={valueUpdate.investedAmount ?? ""}
                className="w-full h-11 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] body-sm"
              />
            </div>
            <Button type="submit" fullWidth disabled={pending}>
              {pending ? "Updating…" : "Update value"}
            </Button>
          </form>
        )}
      </Sheet>
    </>
  );
}
