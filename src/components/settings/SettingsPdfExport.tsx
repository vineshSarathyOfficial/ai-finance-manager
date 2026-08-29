"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportTransactionsPdfAction } from "@/actions/export";
import { formatDateInput } from "@/lib/utils";
import { cn } from "@/lib/utils";

function downloadBase64File(base64: string, filename: string, mimeType: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function SettingsPdfExport() {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"current_month" | "custom">("current_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function handleExport() {
    startTransition(async () => {
      const result = await exportTransactionsPdfAction(
        mode === "current_month"
          ? { mode: "current_month" }
          : { mode: "custom", dateFrom, dateTo }
      );

      if (!result.success || !result.pdf || !result.filename) {
        toast.error(result.message ?? "PDF export failed.");
        return;
      }

      downloadBase64File(result.pdf, result.filename, "application/pdf");
      toast.success(`Exported ${result.filename}`);
    });
  }

  const fieldClass =
    "w-full h-11 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("current_month")}
          className={cn(
            "min-h-[40px] px-3.5 py-2 rounded-[var(--radius-full)] border text-sm font-medium transition-colors",
            mode === "current_month"
              ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)]"
              : "border-[var(--color-hairline)] text-[var(--color-ink-secondary)]"
          )}
        >
          Current month
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={cn(
            "min-h-[40px] px-3.5 py-2 rounded-[var(--radius-full)] border text-sm font-medium transition-colors",
            mode === "custom"
              ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)]"
              : "border-[var(--color-hairline)] text-[var(--color-ink-secondary)]"
          )}
        >
          Custom range
        </button>
      </div>

      {mode === "custom" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="pdf-from" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              From
            </label>
            <input
              id="pdf-from"
              type="date"
              value={dateFrom}
              max={dateTo || formatDateInput(new Date())}
              onChange={(e) => setDateFrom(e.target.value)}
              className={cn(fieldClass, "native-date-input")}
            />
          </div>
          <div>
            <label htmlFor="pdf-to" className="eyebrow text-[var(--color-ink-muted)] uppercase mb-1.5 block">
              To
            </label>
            <input
              id="pdf-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              max={formatDateInput(new Date())}
              onChange={(e) => setDateTo(e.target.value)}
              className={cn(fieldClass, "native-date-input")}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={isPending || (mode === "custom" && (!dateFrom || !dateTo))}
        className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-[var(--color-ink)] body-sm font-medium hover:bg-[var(--color-canvas-soft)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Export PDF
      </button>
    </div>
  );
}
