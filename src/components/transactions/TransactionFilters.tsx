"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import type { Category } from "@/types/finance";
import type { TransactionFilters } from "@/lib/validations/transaction";

interface TransactionFiltersProps {
  categories: Category[];
  filters: TransactionFilters;
}

export function TransactionFilters({ categories, filters }: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (updates: Partial<TransactionFilters>) => {
      const params = new URLSearchParams();
      const merged = { ...filters, ...updates, page: 1 };

      if (merged.search) params.set("search", merged.search);
      if (merged.type && merged.type !== "ALL") params.set("type", merged.type);
      if (merged.categoryId) params.set("categoryId", merged.categoryId);
      if (merged.dateFrom) params.set("dateFrom", merged.dateFrom);
      if (merged.dateTo) params.set("dateTo", merged.dateTo);
      if (merged.sortBy !== "transactionDate") params.set("sortBy", merged.sortBy);
      if (merged.sortOrder !== "desc") params.set("sortOrder", merged.sortOrder);

      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, pathname, router]
  );

  const clearAll = () => router.push(pathname);

  const hasActiveFilters =
    filters.search || filters.type || filters.categoryId || filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] p-4 shadow-level-1">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-faint)]" />
          <input
            id="tx-search"
            type="text"
            placeholder="Search transactions…"
            defaultValue={filters.search ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                update({ search: (e.target as HTMLInputElement).value });
              }
            }}
            onBlur={(e) => update({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-colors"
          />
        </div>

        {/* Type */}
        <select
          id="tx-filter-type"
          value={filters.type ?? "ALL"}
          onChange={(e) => update({ type: e.target.value as "ALL" | "INCOME" | "EXPENSE" })}
          className="px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors min-w-[130px]"
        >
          <option value="ALL">All Types</option>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>

        {/* Category */}
        <select
          id="tx-filter-category"
          value={filters.categoryId ?? ""}
          onChange={(e) => update({ categoryId: e.target.value || undefined })}
          className="px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors min-w-[150px]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ""}{c.name}
            </option>
          ))}
        </select>

        {/* Date From */}
        <input
          id="tx-filter-date-from"
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(e) => update({ dateFrom: e.target.value || undefined })}
          placeholder="From"
          className="px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />

        {/* Date To */}
        <input
          id="tx-filter-date-to"
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(e) => update({ dateTo: e.target.value || undefined })}
          className="px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] text-[var(--color-ink)] body-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
        />

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] text-[var(--color-ink-muted)] body-sm hover:bg-[var(--color-canvas-soft)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
