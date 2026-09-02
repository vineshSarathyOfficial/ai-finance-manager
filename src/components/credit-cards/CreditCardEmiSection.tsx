"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CreditCardEmiFormModal } from "./CreditCardEmiFormModal";
import { deleteCreditCardEmiAction } from "@/actions/credit-cards";
import type { SerializedCreditCardEmi } from "@/types/credit-card";

interface CreditCardEmiSectionProps {
  accountId: string;
  emis: SerializedCreditCardEmi[];
}

export function CreditCardEmiSection({ accountId, emis }: CreditCardEmiSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editEmi, setEditEmi] = useState<SerializedCreditCardEmi | null>(null);
  const router = useRouter();

  const active = emis.filter((e) => e.status === "ACTIVE");
  const completed = emis.filter((e) => e.status === "COMPLETED");

  const handleDelete = async (emi: SerializedCreditCardEmi) => {
    const result = await deleteCreditCardEmiAction(emi.id, accountId);
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const EmiRow = ({ emi }: { emi: SerializedCreditCardEmi }) => (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-[var(--color-hairline-soft)] last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="body-sm font-medium text-[var(--color-ink)]">{emi.name}</p>
          <Badge variant={emi.status === "ACTIVE" ? "primary" : "muted"}>
            {emi.status === "ACTIVE" ? "Active" : "Completed"}
          </Badge>
        </div>
        <p className="caption text-[var(--color-ink-muted)] mt-1">
          {formatCurrency(emi.monthlyAmount)}/mo · {emi.remainingMonths} months left ·{" "}
          {formatCurrency(emi.remainingPrincipal)} remaining
        </p>
        <p className="caption text-[var(--color-ink-faint)]">
          Original {formatCurrency(emi.originalAmount)}
          {emi.interestRate != null ? ` · ${emi.interestRate}% interest` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setEditEmi(emi);
            setShowForm(true);
          }}
          className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-canvas-soft)]"
          aria-label="Edit EMI"
        >
          <Pencil className="w-4 h-4 text-[var(--color-ink-muted)]" />
        </button>
        <button
          type="button"
          onClick={() => handleDelete(emi)}
          className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-canvas-soft)]"
          aria-label="Delete EMI"
        >
          <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Card padding="md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <CardTitle>EMIs</CardTitle>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditEmi(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add EMI
          </Button>
        </div>

        {emis.length === 0 ? (
          <p className="body-sm text-[var(--color-ink-muted)]">
            No EMIs recorded. Add existing Smart EMI plans to track commitments separately.
          </p>
        ) : (
          <div>
            {active.length > 0 && (
              <div className="mb-4">
                <p className="caption text-[var(--color-ink-muted)] mb-2">Active</p>
                {active.map((emi) => (
                  <EmiRow key={emi.id} emi={emi} />
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <p className="caption text-[var(--color-ink-muted)] mb-2">Completed</p>
                {completed.map((emi) => (
                  <EmiRow key={emi.id} emi={emi} />
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <CreditCardEmiFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditEmi(null);
        }}
        accountId={accountId}
        emi={editEmi ?? undefined}
      />
    </>
  );
}
