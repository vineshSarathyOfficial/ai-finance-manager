import { extractMerchantKey } from "./narration";
import type { CategorizationResult } from "./engine";
import type { Category } from "@/types/finance";

export interface CategoryHistoryEntry {
  merchantKey: string;
  categoryId: string;
  categoryName: string;
  type: "INCOME" | "EXPENSE";
}

export function buildCategoryHistory(
  transactions: Array<{
    description: string;
    type: "INCOME" | "EXPENSE";
    categoryId: string;
    category: { name: string };
  }>
): CategoryHistoryEntry[] {
  const map = new Map<string, CategoryHistoryEntry>();

  for (const tx of transactions) {
    const key = extractMerchantKey(tx.description);
    if (!key || key.length < 3) continue;

    // Most recent categorization wins (transactions are expected newest-first)
    if (!map.has(`${tx.type}:${key}`)) {
      map.set(`${tx.type}:${key}`, {
        merchantKey: key,
        categoryId: tx.categoryId,
        categoryName: tx.category.name,
        type: tx.type,
      });
    }
  }

  return Array.from(map.values());
}

function wordOverlap(a: string, b: string): number {
  const setA = new Set(a.split(" ").filter(Boolean));
  const setB = new Set(b.split(" ").filter(Boolean));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

export function matchFromHistory(
  description: string,
  type: "INCOME" | "EXPENSE",
  history: CategoryHistoryEntry[],
  categories: Category[]
): CategorizationResult | null {
  if (history.length === 0) return null;

  const key = extractMerchantKey(description);
  if (!key || key.length < 3) return null;

  const typeHistory = history.filter((h) => h.type === type);

  // Exact merchant key match
  const exact = typeHistory.find((h) => h.merchantKey === key);
  if (exact && categories.some((c) => c.id === exact.categoryId)) {
    return {
      categoryId: exact.categoryId,
      categoryName: exact.categoryName,
      confidence: 0.92,
      matchType: "HISTORY",
      matchedKeyword: exact.merchantKey,
    };
  }

  // Fuzzy match on merchant key
  let best: { entry: CategoryHistoryEntry; score: number } | null = null;
  for (const entry of typeHistory) {
    const score = wordOverlap(key, entry.merchantKey);
    if (score >= 0.65 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  if (best && categories.some((c) => c.id === best.entry.categoryId)) {
    return {
      categoryId: best.entry.categoryId,
      categoryName: best.entry.categoryName,
      confidence: 0.75 + best.score * 0.15,
      matchType: "HISTORY",
      matchedKeyword: best.entry.merchantKey,
    };
  }

  return null;
}
