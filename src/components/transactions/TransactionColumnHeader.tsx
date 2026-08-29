"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionFilters } from "@/lib/validations/transaction";

const PAYMENT_METHODS = ["UPI", "Cash", "Credit Card", "Debit Card", "Net Banking", "Cheque", "Other"];

interface TransactionColumnHeaderProps {
  label: string;
  sortKey?: TransactionFilters["sortBy"];
  filters: TransactionFilters;
  onSort: (key: TransactionFilters["sortBy"]) => void;
  onApplyFilter: (updates: Partial<TransactionFilters>) => void;
  onClearFilter: () => void;
  hasActiveFilter?: boolean;
  children: ReactNode;
}

export function TransactionColumnHeader({
  label,
  sortKey,
  filters,
  onSort,
  onApplyFilter,
  onClearFilter,
  hasActiveFilter,
  children,
}: TransactionColumnHeaderProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const isSorted = sortKey && filters.sortBy === sortKey;
  const SortIcon = !isSorted ? ArrowUpDown : filters.sortOrder === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className="px-4 py-3 text-left align-top relative">
      <div className="flex items-center gap-1" ref={ref}>
        {sortKey ? (
          <button
            type="button"
            onClick={() => onSort(sortKey)}
            className={cn(
              "flex items-center gap-1 eyebrow uppercase transition-colors",
              isSorted ? "text-[var(--color-primary)]" : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            )}
          >
            {label}
            <SortIcon className="w-3 h-3 flex-shrink-0" />
          </button>
        ) : (
          <span className="eyebrow text-[var(--color-ink-muted)] uppercase">{label}</span>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Filter ${label}`}
          className={cn(
            "p-1 rounded-[var(--radius-xs)] transition-colors",
            hasActiveFilter || open
              ? "text-[var(--color-primary)] bg-[var(--color-primary-bg-subdued)]"
              : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas-soft)]"
          )}
        >
          <Filter className="w-3 h-3" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface)] shadow-level-2 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="eyebrow text-[var(--color-ink-muted)]">Filter {label}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-0.5 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {children}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--color-hairline)]">
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    onClearFilter();
                    setOpen(false);
                  }}
                  className="flex-1 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-hairline)] body-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)]"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] button-sm hover:bg-[var(--color-primary-active)]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </th>
  );
}

export function DateColumnFilter({
  filters,
  onApply,
}: {
  filters: TransactionFilters;
  onApply: (updates: Partial<TransactionFilters>) => void;
}) {
  const [from, setFrom] = useState(filters.dateFrom ?? "");
  const [to, setTo] = useState(filters.dateTo ?? "");

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="caption text-[var(--color-ink-muted)]">From</span>
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            onApply({ dateFrom: e.target.value || undefined });
          }}
          className="mt-1 w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
        />
      </label>
      <label className="block">
        <span className="caption text-[var(--color-ink-muted)]">To</span>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            onApply({ dateTo: e.target.value || undefined });
          }}
          className="mt-1 w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
        />
      </label>
    </div>
  );
}

export function TextColumnFilter({
  value,
  placeholder,
  onApply,
}: {
  value?: string;
  placeholder: string;
  onApply: (value: string | undefined) => void;
}) {
  const [text, setText] = useState(value ?? "");

  return (
    <input
      type="text"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        onApply(e.target.value || undefined);
      }}
      className="w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
    />
  );
}

export function CategoryColumnFilter({
  categories,
  value,
  onApply,
}: {
  categories: { id: string; name: string }[];
  value?: string;
  onApply: (categoryId: string | undefined) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onApply(e.target.value || undefined)}
      className="w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
    >
      <option value="">All categories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export function PaymentColumnFilter({
  value,
  onApply,
}: {
  value?: string;
  onApply: (paymentMethod: string | undefined) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onApply(e.target.value || undefined)}
      className="w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
    >
      <option value="">All methods</option>
      {PAYMENT_METHODS.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  );
}

export function AmountColumnFilter({
  filters,
  onApply,
}: {
  filters: TransactionFilters;
  onApply: (updates: Partial<TransactionFilters>) => void;
}) {
  const [min, setMin] = useState(filters.minAmount?.toString() ?? "");
  const [max, setMax] = useState(filters.maxAmount?.toString() ?? "");

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="caption text-[var(--color-ink-muted)]">Min (₹)</span>
        <input
          type="number"
          min="0"
          value={min}
          onChange={(e) => {
            setMin(e.target.value);
            onApply({ minAmount: e.target.value ? Number(e.target.value) : undefined });
          }}
          className="mt-1 w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
        />
      </label>
      <label className="block">
        <span className="caption text-[var(--color-ink-muted)]">Max (₹)</span>
        <input
          type="number"
          min="0"
          value={max}
          onChange={(e) => {
            setMax(e.target.value);
            onApply({ maxAmount: e.target.value ? Number(e.target.value) : undefined });
          }}
          className="mt-1 w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
        />
      </label>
    </div>
  );
}

export function TypeColumnFilter({
  value,
  onApply,
}: {
  value?: TransactionFilters["type"];
  onApply: (type: TransactionFilters["type"]) => void;
}) {
  return (
    <select
      value={value ?? "ALL"}
      onChange={(e) => onApply(e.target.value as TransactionFilters["type"])}
      className="w-full px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] body-sm"
    >
      <option value="ALL">All types</option>
      <option value="INCOME">Income</option>
      <option value="EXPENSE">Expense</option>
    </select>
  );
}
