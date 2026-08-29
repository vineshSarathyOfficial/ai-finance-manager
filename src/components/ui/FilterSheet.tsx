"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

interface FilterSheetProps {
  activeCount: number;
  onClear: () => void;
  children: ReactNode;
}

export function FilterSheet({ activeCount, onClear, children }: FilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="lg:hidden"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 bg-[var(--color-primary)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Filters">
        <div className="space-y-3 flex flex-col">{children}</div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--color-hairline)]">
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} fullWidth>
              Clear all
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen(false)} fullWidth>
            Apply
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`hidden lg:block ${className ?? ""}`}>
      <div className="bg-[var(--color-surface-card)] rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-4">
        <div className="flex flex-wrap gap-3">{children}</div>
      </div>
    </div>
  );
}
