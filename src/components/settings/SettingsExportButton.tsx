"use client";

import { useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportTransactionsCsvAction } from "@/actions/export";
import { toast } from "sonner";

export function SettingsExportButton() {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const result = await exportTransactionsCsvAction();

      if (!result.success || !result.csv || !result.filename) {
        toast.error(result.message ?? "Export failed.");
        return;
      }

      // Decode base64 → Blob → download
      const bytes = Uint8Array.from(atob(result.csv), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${result.filename}`);
    });
  }

  return (
    <button
      id="export-csv-btn"
      onClick={handleExport}
      disabled={isPending}
      className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white body-sm font-medium hover:bg-[var(--color-primary-active)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Export CSV
    </button>
  );
}
