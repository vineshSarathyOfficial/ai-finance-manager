import { FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { StatementImport } from "@/types/finance";

interface ImportHistoryListProps {
  imports: StatementImport[];
}

export function ImportHistoryList({ imports }: ImportHistoryListProps) {
  if (imports.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-6 text-center shadow-level-1">
        <FileSpreadsheet className="w-8 h-8 text-[var(--color-ink-faint)] mx-auto mb-2" />
        <p className="body-sm text-[var(--color-ink-muted)]">No statements imported yet.</p>
        <p className="caption text-[var(--color-ink-faint)] mt-0.5">
          Uploaded statements and their batch audit trails will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--color-hairline)]">
        <h3 className="title text-[var(--color-ink)]">Import History</h3>
      </div>
      <div className="divide-y divide-[var(--color-hairline)]">
        {imports.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--color-canvas-soft)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-bg-subdued)]/30 flex items-center justify-center text-[var(--color-primary)]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="body-sm font-medium text-[var(--color-ink)]">{item.fileName}</p>
                <p className="caption text-[var(--color-ink-faint)]">
                  {formatDate(item.createdAt)} · {item.source}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-[var(--radius-full)] border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item.importedCount} imported
                </span>
                {item.duplicateCount > 0 && (
                  <p className="caption text-[var(--color-ink-faint)] text-[11px] mt-0.5">
                    {item.duplicateCount} duplicates skipped
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
