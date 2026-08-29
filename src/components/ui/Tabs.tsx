"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-[var(--color-hairline)] -mx-1 px-1 scrollbar-none",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-shrink-0 px-4 py-3 button-sm transition-colors border-b-2 -mb-px",
            activeTab === tab.id
              ? "text-[var(--color-primary)] border-[var(--color-primary)] font-medium"
              : "text-[var(--color-ink-muted)] border-transparent hover:text-[var(--color-ink)]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ children, active, id }: { children: ReactNode; active: boolean; id: string }) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={id} className="pt-6">
      {children}
    </div>
  );
}
