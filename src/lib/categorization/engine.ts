import { MERCHANT_RULES } from "./rules";
import type { Category } from "@/types/finance";

export interface CategorizationResult {
  categoryId: string;
  categoryName: string;
  confidence: number;
  matchType: "RULE" | "AI_FALLBACK" | "DEFAULT";
  matchedKeyword?: string;
}

/**
 * Categorizes a transaction based on narration and type.
 * Uses high-precision deterministic rules first, then semantic heuristic fallback.
 */
export function categorizeTransaction(
  description: string,
  type: "INCOME" | "EXPENSE",
  categories: Category[]
): CategorizationResult {
  const normalized = description.toLowerCase().trim();

  const availableCategories = categories.filter((c) => c.type === type);
  const findCategory = (name: string) =>
    availableCategories.find((c) => c.name.toLowerCase() === name.toLowerCase()) ??
    availableCategories.find((c) => c.name.toLowerCase() === "other") ??
    availableCategories[0];

  // 1. High-precision rule matching
  for (const rule of MERCHANT_RULES) {
    if (rule.type !== type) continue;

    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
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
        if (pattern.test(normalized)) {
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

  // 2. AI Fallback Classifier (Heuristics for generic patterns)
  const aiMatch = runAiFallbackClassifier(normalized, type, availableCategories);
  if (aiMatch) {
    return aiMatch;
  }

  // 3. Default "Other" category
  const defaultCategory = findCategory("Other");
  return {
    categoryId: defaultCategory?.id ?? categories[0]?.id ?? "",
    categoryName: defaultCategory?.name ?? "Other",
    confidence: 0.35,
    matchType: "DEFAULT",
  };
}

function runAiFallbackClassifier(
  text: string,
  type: "INCOME" | "EXPENSE",
  availableCategories: Category[]
): CategorizationResult | null {
  // UPI transfer heuristics
  if (text.includes("upi") || text.includes("/upi/")) {
    if (type === "EXPENSE") {
      const foodCat = availableCategories.find((c) => c.name === "Food" || c.name === "Shopping");
      if (foodCat) {
        return {
          categoryId: foodCat.id,
          categoryName: foodCat.name,
          confidence: 0.65,
          matchType: "AI_FALLBACK",
          matchedKeyword: "UPI Merchant Transfer",
        };
      }
    }
  }

  // POS card payment
  if (text.includes("pos ") || text.includes("ecom ")) {
    const shoppingCat = availableCategories.find((c) => c.name === "Shopping");
    if (shoppingCat) {
      return {
        categoryId: shoppingCat.id,
        categoryName: shoppingCat.name,
        confidence: 0.60,
        matchType: "AI_FALLBACK",
        matchedKeyword: "Card POS/Ecom",
      };
    }
  }

  // ATM Cash withdrawal
  if (text.includes("atm ") || text.includes("nfs ") || text.includes("cash wdl")) {
    const otherCat = availableCategories.find((c) => c.name === "Other");
    if (otherCat) {
      return {
        categoryId: otherCat.id,
        categoryName: otherCat.name,
        confidence: 0.70,
        matchType: "AI_FALLBACK",
        matchedKeyword: "ATM Cash Withdrawal",
      };
    }
  }

  return null;
}
