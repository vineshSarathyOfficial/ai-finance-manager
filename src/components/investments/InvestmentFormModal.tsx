"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { createInvestmentAction, updateInvestmentAction } from "@/actions/investments";
import { formatDateInput } from "@/lib/utils";
import type { InvestmentType, SerializedInvestment } from "@/types/investment";
import { INVESTMENT_TYPE_LABELS } from "@/types/investment";

interface InvestmentFormModalProps {
  open: boolean;
  onClose: () => void;
  investment?: SerializedInvestment;
  defaultType?: InvestmentType;
}

const inputClass =
  "w-full h-11 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm focus:outline-none focus:border-2 focus:border-[var(--color-ink)]";

export function InvestmentFormModal({
  open,
  onClose,
  investment,
  defaultType = "SIP",
}: InvestmentFormModalProps) {
  const [pending, setPending] = useState(false);
  const [type, setType] = useState<InvestmentType>(investment?.type ?? defaultType);
  const router = useRouter();
  const isEdit = Boolean(investment);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);

    const result = isEdit
      ? await updateInvestmentAction(investment!.id, formData)
      : await createInvestmentAction(formData);

    setPending(false);
    if (result.success) {
      toast.success(result.message);
      onClose();
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  const showMonthly = type === "SIP" || type === "EPFO";
  const showEmployer = type === "EPFO";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Investment" : "Add Investment"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InvestmentType)}
              className={inputClass}
            >
              {(Object.keys(INVESTMENT_TYPE_LABELS) as InvestmentType[]).map((t) => (
                <option key={t} value={t}>
                  {INVESTMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Name</label>
          <input
            name="name"
            required
            defaultValue={investment?.name}
            className={inputClass}
            placeholder={type === "SIP" ? "Parag Parikh Flexi Cap" : type === "EPFO" ? "EPFO" : "Investment name"}
          />
        </div>

        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">
            {type === "EPFO" ? "Employer" : "Platform / AMC"}
          </label>
          <input
            name="institution"
            defaultValue={investment?.institution ?? ""}
            className={inputClass}
            placeholder={type === "EPFO" ? "Company name" : "Groww, Zerodha, HDFC MF…"}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Current value (₹)</label>
            <input
              name="currentValue"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={investment?.currentValue}
              className={inputClass}
            />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Total invested (₹)</label>
            <input
              name="investedAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={investment?.investedAmount ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        {showMonthly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">
                {type === "EPFO" ? "Your monthly (₹)" : "Monthly SIP (₹)"}
              </label>
              <input
                name="monthlyContribution"
                type="number"
                step="0.01"
                min="0"
                defaultValue={investment?.monthlyContribution ?? ""}
                className={inputClass}
              />
            </div>
            {showEmployer && (
              <div>
                <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Employer monthly (₹)</label>
                <input
                  name="employerContribution"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={investment?.employerContribution ?? ""}
                  className={inputClass}
                />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Start date</label>
            <input
              name="startDate"
              type="date"
              defaultValue={investment?.startDate ? formatDateInput(investment.startDate) : ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Target (optional, ₹)</label>
            <input
              name="targetAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={investment?.targetAmount ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="caption text-[var(--color-ink-muted)] mb-1.5 block">Notes</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={investment?.notes ?? ""}
            className={`${inputClass} h-auto py-2`}
            placeholder="Folio number, UAN, reminders…"
          />
        </div>

        {isEdit && (
          <label className="flex items-center gap-2 body-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={investment?.isActive}
              className="rounded"
            />
            Active
          </label>
        )}

        <p className="caption text-[var(--color-ink-faint)]">
          Update current value monthly from your MF statement or EPFO passbook. SIP debits from your bank can still be logged under Transactions → Investment.
        </p>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button type="submit" disabled={pending} fullWidth>
            {pending ? "Saving…" : isEdit ? "Save" : "Add"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
