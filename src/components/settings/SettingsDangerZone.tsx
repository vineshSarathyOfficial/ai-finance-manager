"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteAllTransactionsAction } from "@/actions/export";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Props {
  txCount: number;
}

export function SettingsDangerZone({ txCount }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAllTransactionsAction();
      if (result.success) {
        toast.success(result.message ?? "All data deleted.");
        setConfirmed(false);
        router.refresh();
      } else {
        toast.error(result.message ?? "Failed to delete data.");
      }
    });
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-error)]/25 shadow-level-1 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-error)]/20 bg-[var(--color-error-bg)]">
        <AlertTriangle className="w-4 h-4 text-[var(--color-error)]" />
        <h2 className="title text-[var(--color-error)]">Danger Zone</h2>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="body-sm text-[var(--color-ink)] font-medium">Delete all transactions</p>
            <p className="caption text-[var(--color-ink-muted)] mt-0.5">
              Permanently removes all {txCount} transaction{txCount !== 1 ? "s" : ""}, import history, and detected recurring patterns. This cannot be undone.
            </p>
          </div>

          {!confirmed ? (
            <button
              id="danger-zone-delete-btn"
              onClick={() => setConfirmed(true)}
              disabled={txCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] border border-[var(--color-error)]/40 text-[var(--color-error)] body-sm font-medium hover:bg-[var(--color-error-bg)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete all
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setConfirmed(false)}
                className="px-3 py-2 rounded-[var(--radius-full)] border border-[var(--color-hairline)] body-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)] transition-colors"
              >
                Cancel
              </button>
              <button
                id="danger-zone-confirm-btn"
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-error)] text-white body-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirm delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
