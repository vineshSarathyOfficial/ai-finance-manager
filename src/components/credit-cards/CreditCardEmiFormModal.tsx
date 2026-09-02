"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import {
  createCreditCardEmiAction,
  updateCreditCardEmiAction,
} from "@/actions/credit-cards";
import { formatDateInput } from "@/lib/utils";
import type { SerializedCreditCardEmi } from "@/types/credit-card";

interface CreditCardEmiFormModalProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  emi?: SerializedCreditCardEmi;
}

const inputClass =
  "w-full h-11 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm focus:outline-none focus:border-2 focus:border-[var(--color-ink)]";

export function CreditCardEmiFormModal({
  open,
  onClose,
  accountId,
  emi,
}: CreditCardEmiFormModalProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const isEdit = Boolean(emi);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("accountId", accountId);
    if (isEdit && emi) {
      formData.set("id", emi.id);
      formData.set("status", emi.status);
    }

    const result = isEdit
      ? await updateCreditCardEmiAction(formData)
      : await createCreditCardEmiAction(formData);

    setPending(false);
    if (result.success) {
      toast.success(result.message);
      onClose();
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={isEdit ? "Edit EMI" : "Add EMI"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">EMI name</label>
          <input name="name" required defaultValue={emi?.name} className={inputClass} placeholder="Amazon Smart EMI" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Original amount (₹)</label>
            <input name="originalAmount" type="number" step="0.01" min="0" required defaultValue={emi?.originalAmount} className={inputClass} />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Monthly EMI (₹)</label>
            <input name="monthlyAmount" type="number" step="0.01" min="0" required defaultValue={emi?.monthlyAmount} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Remaining principal (₹)</label>
            <input name="remainingPrincipal" type="number" step="0.01" min="0" required defaultValue={emi?.remainingPrincipal} className={inputClass} />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Remaining months</label>
            <input name="remainingMonths" type="number" min="0" required defaultValue={emi?.remainingMonths} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Total tenure (months)</label>
            <input name="totalTenureMonths" type="number" min="1" required defaultValue={emi?.totalTenureMonths} className={inputClass} />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Interest rate (%)</label>
            <input name="interestRate" type="number" step="0.01" min="0" defaultValue={emi?.interestRate ?? ""} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Start date</label>
            <input name="startDate" type="date" required defaultValue={emi ? formatDateInput(emi.startDate) : ""} className={inputClass} />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">End date (optional)</label>
            <input name="endDate" type="date" defaultValue={emi?.endDate ? formatDateInput(emi.endDate) : ""} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Processing fee (₹)</label>
          <input name="processingFee" type="number" step="0.01" min="0" defaultValue={emi?.processingFee ?? ""} className={inputClass} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} fullWidth>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add EMI"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
