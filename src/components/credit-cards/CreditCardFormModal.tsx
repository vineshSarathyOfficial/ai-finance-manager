"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { createCreditCardAction, updateCreditCardAction } from "@/actions/credit-cards";
import type { SerializedCreditCard } from "@/types/credit-card";

interface CreditCardFormModalProps {
  open: boolean;
  onClose: () => void;
  card?: SerializedCreditCard;
}

const inputClass =
  "w-full h-11 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm focus:outline-none focus:border-2 focus:border-[var(--color-ink)]";

export function CreditCardFormModal({ open, onClose, card }: CreditCardFormModalProps) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const isEdit = Boolean(card);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    if (isEdit && card) formData.set("id", card.id);

    const result = isEdit
      ? await updateCreditCardAction(formData)
      : await createCreditCardAction(formData);

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
    <Sheet open={open} onClose={onClose} title={isEdit ? "Edit Credit Card" : "Add Credit Card"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Card name</label>
          <input name="name" required defaultValue={card?.name} className={inputClass} placeholder="HDFC Regalia" />
        </div>
        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Bank / provider</label>
          <input name="institution" defaultValue={card?.institution ?? ""} className={inputClass} placeholder="HDFC Bank" />
        </div>
        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Last 4 digits</label>
          <input name="lastFour" maxLength={4} defaultValue={card?.lastFour ?? ""} className={inputClass} placeholder="1234" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Credit limit (₹)</label>
            <input name="creditLimit" type="number" step="0.01" min="0" defaultValue={card?.creditLimit ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Existing outstanding (₹)</label>
            <input name="openingOutstanding" type="number" step="0.01" min="0" defaultValue={card?.openingOutstanding ?? ""} className={inputClass} />
          </div>
        </div>
        <p className="caption text-[var(--color-ink-faint)]">
          Opening outstanding is your balance as of when you start tracking. Only import transactions after that date to avoid overlap.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Billing cycle day</label>
            <input name="billingCycleDay" type="number" min="1" max="28" defaultValue={card?.billingCycleDay ?? ""} className={inputClass} placeholder="1–28" />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Payment due day</label>
            <input name="paymentDueDay" type="number" min="1" max="28" defaultValue={card?.paymentDueDay ?? ""} className={inputClass} placeholder="1–28" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} fullWidth>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add card"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
