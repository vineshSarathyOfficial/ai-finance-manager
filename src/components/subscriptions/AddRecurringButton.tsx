"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { RecurringFormModal } from "./RecurringFormModal";
import type { Category } from "@/types/finance";

export function AddRecurringButton({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-full)] border border-[var(--color-hairline)] bg-[var(--color-surface)] body-sm font-medium hover:bg-[var(--color-canvas-soft)] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add
      </button>
      {open && (
        <RecurringFormModal
          open
          onClose={() => setOpen(false)}
          categories={categories}
          mode="create"
        />
      )}
    </>
  );
}
