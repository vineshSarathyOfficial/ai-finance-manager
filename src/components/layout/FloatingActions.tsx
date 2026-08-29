"use client";

import { Plus } from "lucide-react";
import { useAddTransaction } from "@/components/transactions/AddTransactionContext";
import { AiCopilotTrigger } from "@/components/ai/AiCopilotTrigger";

export function FloatingActions() {
  const { openCreate } = useAddTransaction();

  return (
    <div className="fixed z-40 right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 lg:right-6 flex flex-col-reverse items-end gap-3">
      <AiCopilotTrigger />
      <button
        type="button"
        onClick={openCreate}
        className="lg:hidden w-12 h-12 rounded-[var(--radius-full)] bg-[var(--color-ink)] text-white shadow-level-2 flex items-center justify-center active:scale-[0.97] transition-transform"
        aria-label="Add transaction"
        title="Add transaction"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
