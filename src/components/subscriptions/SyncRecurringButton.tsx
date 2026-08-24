"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { syncRecurringTransactionsAction } from "@/actions/recurring";

interface Props {
  hasTransactions: boolean;
}

export function SyncRecurringButton({ hasTransactions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncRecurringTransactionsAction();
      if (result.success) {
        setSynced(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  if (!hasTransactions) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] caption text-[var(--color-ink-faint)]">
        <Sparkles className="w-3.5 h-3.5" />
        Import transactions to enable detection
      </div>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm font-medium hover:bg-[var(--color-primary-active)] transition-all disabled:opacity-60 shadow-sm"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : synced ? (
        <Sparkles className="w-4 h-4" />
      ) : (
        <RefreshCw className="w-4 h-4" />
      )}
      {isPending ? "Scanning…" : synced ? "Re-scan" : "Scan Transactions"}
    </button>
  );
}
