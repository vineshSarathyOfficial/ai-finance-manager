"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Search, X } from "lucide-react";
import type { Category } from "@/types/finance";
import type { TransactionFilters } from "@/lib/validations/transaction";
import { FilterSheet, FilterBar } from "@/components/ui/FilterSheet";
import { Select } from "@/components/ui/Input";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface TransactionFiltersProps {
  categories: Category[];
  accounts?: Account[];
  filters: TransactionFilters;
}

function FilterControls({
  categories,
  accounts,
  filters,
  update,
}: TransactionFiltersProps & { update: (u: Partial<TransactionFilters>) => void }) {
  return (
    <>
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink-faint)]" />
        <input
          type="text"
          placeholder="Search transactions…"
          defaultValue={filters.search ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") update({ search: (e.target as HTMLInputElement).value });
          }}
          onBlur={(e) => update({ search: e.target.value })}
          className="w-full h-12 pl-9 pr-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] text-[var(--color-ink)] body-sm placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-2 focus:border-[var(--color-ink)]"
        />
      </div>

      <select
        value={filters.type ?? "ALL"}
        onChange={(e) => update({ type: e.target.value as "ALL" | "INCOME" | "EXPENSE" })}
        className="h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm min-w-[120px]"
      >
        <option value="ALL">All Types</option>
        <option value="INCOME">Income</option>
        <option value="EXPENSE">Expense</option>
      </select>

      <select
        value={filters.categoryId ?? ""}
        onChange={(e) => update({ categoryId: e.target.value || undefined })}
        className="h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm min-w-[140px]"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {accounts && accounts.length > 0 && (
        <select
          value={filters.accountId ?? ""}
          onChange={(e) => update({ accountId: e.target.value || undefined })}
          className="h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm min-w-[140px]"
        >
          <option value="">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      )}

      <input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => update({ dateFrom: e.target.value || undefined })}
        className="h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm"
      />
      <input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(e) => update({ dateTo: e.target.value || undefined })}
        className="h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm"
      />

      <select
        value={filters.sortBy}
        onChange={(e) => update({ sortBy: e.target.value as TransactionFilters["sortBy"] })}
        className="h-12 px-3 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-canvas)] body-sm min-w-[130px]"
      >
        <option value="transactionDate">Date</option>
        <option value="description">Description</option>
        <option value="categoryName">Category</option>
        <option value="paymentMethod">Payment</option>
        <option value="amount">Amount</option>
        <option value="type">Type</option>
        <option value="createdAt">Created</option>
      </select>
    </>
  );
}

export function TransactionFilters({ categories, accounts, filters }: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const update = useCallback(
    (updates: Partial<TransactionFilters>) => {
      const params = new URLSearchParams();
      const merged = { ...filters, ...updates, page: 1 };

      Object.entries(merged).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === false) return;
        if (key === "type" && value === "ALL") return;
        if (key === "sortBy" && value === "transactionDate") return;
        if (key === "sortOrder" && value === "desc") return;
        if (key === "page" && value === 1) return;
        if (key === "pageSize" && value === 20) return;
        params.set(key, String(value));
      });

      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, pathname, router]
  );

  const clearAll = () => router.push(pathname);

  const activeCount = [
    filters.search, filters.type && filters.type !== "ALL",
    filters.categoryId, filters.accountId, filters.dateFrom, filters.dateTo,
  ].filter(Boolean).length;

  return (
    <div>
      <FilterBar>
        <FilterControls categories={categories} accounts={accounts} filters={filters} update={update} />
        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 body-sm text-[var(--color-primary)] h-12 px-3">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </FilterBar>

      <div className="lg:hidden flex items-center gap-2">
        <FilterSheet activeCount={activeCount} onClear={clearAll}>
          <FilterControls categories={categories} accounts={accounts} filters={filters} update={update} />
        </FilterSheet>
        {activeCount > 0 && (
          <button onClick={clearAll} className="body-sm text-[var(--color-primary)]">Clear</button>
        )}
      </div>
    </div>
  );
}
