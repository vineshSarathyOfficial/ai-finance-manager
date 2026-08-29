import { MERCHANT_RULES } from "./rules";
import { normalizeBankNarration } from "./narration";
import { matchFromHistory, type CategoryHistoryEntry } from "./history";
import type { Category } from "@/types/finance";

export interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
  matchType: "RULE" | "HISTORY" | "AI_FALLBACK" | "DEFAULT";
  matchedKeyword?: string;
}

export interface CategorizeOptions {
  history?: CategoryHistoryEntry[];
}

/**
 * Categorizes a transaction based on narration and type.
 * Priority: user history → merchant rules → heuristics → default.
 */
export function categorizeTransaction(
  description: string,
  type: "INCOME" | "EXPENSE",
  categories: Category[],
  options: CategorizeOptions = {}
): CategorizationResult {
  const normalized = normalizeBankNarration(description);
  const rawLower = description.toLowerCase().trim();

  const availableCategories = categories.filter((c) => c.type === type);
  const findCategory = (name: string) =>
    availableCategories.find((c) => c.name.toLowerCase() === name.toLowerCase()) ??
    availableCategories.find((c) => c.name.toLowerCase() === "other") ??
    availableCategories[0];

  // 1. Learn from user's past categorizations
  if (options.history?.length) {
    const historyMatch = matchFromHistory(description, type, options.history, categories);
    if (historyMatch) return historyMatch;
  }

  // 2. High-precision rule matching (check both raw and normalized narration)
  for (const rule of MERCHANT_RULES) {
    if (rule.type !== type) continue;

    for (const keyword of rule.keywords) {
      if (matchesKeyword(rawLower, keyword) || matchesKeyword(normalized, keyword)) {
        const targetCategory = findCategory(rule.categoryName);
        if (targetCategory) {
          return {
            categoryId: targetCategory.id,
            categoryName: targetCategory.name,
            confidence: rule.confidence,
            matchType: "RULE",
            matchedKeyword: keyword,
          };
        }
      }
    }

    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        if (pattern.test(rawLower) || pattern.test(normalized)) {
          const targetCategory = findCategory(rule.categoryName);
          if (targetCategory) {
            return {
              categoryId: targetCategory.id,
              categoryName: targetCategory.name,
              confidence: rule.confidence,
              matchType: "RULE",
              matchedKeyword: pattern.source,
            };
          }
        }
      }
    }
  }

  // 3. Heuristic fallback for generic bank patterns
  const heuristicMatch = runHeuristicClassifier(normalized, rawLower, type, availableCategories);
  if (heuristicMatch) return heuristicMatch;

  // 4. Default "Other" category
  const defaultCategory = findCategory("Other");
  return {
    categoryId: defaultCategory?.id ?? categories[0]?.id ?? "",
    categoryName: defaultCategory?.name ?? "Other",
    confidence: 0.35,
    matchType: "DEFAULT",
  };
}

/** Match keyword with word boundaries for short tokens to avoid false positives */
function matchesKeyword(text: string, keyword: string): boolean {
  const kw = keyword.toLowerCase().trim();
  if (!kw) return false;
  if (kw.length <= 3 || kw.includes(" ")) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|\\s|/)${escaped}(?:\\s|$|/)`, "i").test(text) || text.includes(kw);
  }
  return text.includes(kw);
}

function runHeuristicClassifier(
  normalized: string,
  rawLower: string,
  type: "INCOME" | "EXPENSE",
  availableCategories: Category[]
): CategorizationResult | null {
  // ATM / cash withdrawal
  if (
    /\batm\b/.test(normalized) ||
    /\bnfs\b/.test(normalized) ||
    /cash\s*wdl/.test(normalized) ||
    /cash\s*withdraw/.test(normalized)
  ) {
    const otherCat = availableCategories.find((c) => c.name === "Other");
    if (otherCat) {
      return {
        categoryId: otherCat.id,
        categoryName: otherCat.name,
        confidence: 0.85,
        matchType: "AI_FALLBACK",
        matchedKeyword: "ATM Cash Withdrawal",
      };
    }
  }

  // Fuel-specific (separate from general transport)
  if (/\b(?:petrol|diesel|fuel|hpcl|bpcl|iocl|indian oil|bharat petroleum)\b/.test(normalized)) {
    const fuelCat =
      availableCategories.find((c) => c.name === "Fuel") ??
      availableCategories.find((c) => c.name === "Transport");
    if (fuelCat) {
      return {
        categoryId: fuelCat.id,
        categoryName: fuelCat.name,
        confidence: 0.80,
        matchType: "AI_FALLBACK",
        matchedKeyword: "Fuel",
      };
    }
  }

  // Mobile / DTH recharge
  if (/\b(?:recharge|prepaid|postpaid|dth)\b/.test(normalized)) {
    const billsCat = availableCategories.find((c) => c.name === "Bills");
    if (billsCat) {
      return {
        categoryId: billsCat.id,
        categoryName: billsCat.name,
        confidence: 0.75,
        matchType: "AI_FALLBACK",
        matchedKeyword: "Recharge",
      };
    }
  }

  // NEFT/IMPS credits that look like salary
  if (
    type === "INCOME" &&
    (/\b(?:neft|imps|rtgs)\b/.test(rawLower) || /\b(?:credit|cr)\b/.test(rawLower)) &&
    /\b(?:salary|payroll|corp|pvt|ltd|limited|technologies|solutions)\b/.test(normalized)
  ) {
    const salaryCat = availableCategories.find((c) => c.name === "Salary");
    if (salaryCat) {
      return {
        categoryId: salaryCat.id,
        categoryName: salaryCat.name,
        confidence: 0.80,
        matchType: "AI_FALLBACK",
        matchedKeyword: "Salary credit",
      };
    }
  }

  // P2P UPI transfers — leave uncategorized rather than guessing Food/Shopping
  if (/\bupi\b/.test(rawLower) && normalized.split(" ").length <= 2) {
    return null;
  }

  return null;
}
