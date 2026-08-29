"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
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

export function FilterBar({
  children,
  className,
  activeCount = 0,
}: {
  children: ReactNode;
  className?: string;
  activeCount?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("hidden lg:block", className)}>
      <div className="bg-[var(--color-surface-card)] rounded-[var(--radius-md)] border border-[var(--color-hairline)] overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--color-canvas-soft)] transition-colors"
        >
          <span className="flex items-center gap-2 body-sm font-medium text-[var(--color-ink)]">
            <SlidersHorizontal className="w-4 h-4 text-[var(--color-ink-muted)]" />
            Filters
            {activeCount > 0 && (
              <span className="bg-[var(--color-primary)] text-white text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[var(--color-ink-muted)] transition-transform flex-shrink-0",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="px-4 pb-4 pt-1 border-t border-[var(--color-hairline)]">
            <div className="flex flex-wrap gap-3 items-center">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}
