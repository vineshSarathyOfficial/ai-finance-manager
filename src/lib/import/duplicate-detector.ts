import { prisma } from "@/lib/db/prisma";
import type { ParsedRawTransaction } from "./csv-parser";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateConfidence: number;
  matchedTransactionId?: string;
  matchedDescription?: string;
  matchedDate?: string;
}

/**
 * Checks a batch of parsed transactions against existing user transactions
 * to detect duplicates based on date proximity, exact amount, and description similarity.
 */
export async function detectDuplicates(
  userId: string,
  parsedTransactions: ParsedRawTransaction[]
): Promise<DuplicateCheckResult[]> {
  if (parsedTransactions.length === 0) return [];

  // Determine the bounding date range of the batch
  const dates = parsedTransactions.map((t) => t.date.getTime());
  const minDate = new Date(Math.min(...dates) - 4 * 24 * 60 * 60 * 1000); // -4 days buffer
  const maxDate = new Date(Math.max(...dates) + 4 * 24 * 60 * 60 * 1000); // +4 days buffer

  // Fetch existing user transactions in the candidate time window
  const existingTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: {
        gte: minDate,
        lte: maxDate,
      },
    },
    select: {
      id: true,
      transactionDate: true,
      amount: true,
      description: true,
      type: true,
    },
  });

  return parsedTransactions.map((item) => {
    const itemAmount = item.amount;
    const itemTime = item.date.getTime();
    const itemDesc = item.description.toLowerCase();

    for (const existing of existingTransactions) {
      if (existing.type !== item.type) continue;

      const existingAmount = existing.amount.toNumber();
      // Exact amount match
      if (Math.abs(existingAmount - itemAmount) < 0.01) {
        const timeDiffDays = Math.abs(existing.transactionDate.getTime() - itemTime) / (1000 * 60 * 60 * 24);

        if (timeDiffDays <= 3) {
          const existingDesc = existing.description.toLowerCase();
          const descSimilarity = calculateStringSimilarity(itemDesc, existingDesc);

          if (descSimilarity > 0.4 || timeDiffDays < 1) {
            return {
              isDuplicate: true,
              duplicateConfidence: descSimilarity > 0.7 ? 0.95 : 0.80,
              matchedTransactionId: existing.id,
              matchedDescription: existing.description,
              matchedDate: existing.transactionDate.toISOString().split("T")[0],
            };
          }
        }
      }
    }

    return {
      isDuplicate: false,
      duplicateConfidence: 0,
    };
  });
}

function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const s1 = str1.replace(/[^a-z0-9]/g, "");
  const s2 = str2.replace(/[^a-z0-9]/g, "");

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Word overlap
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  const intersection = Array.from(words1).filter((w) => words2.has(w));
  const union = new Set([...Array.from(words1), ...Array.from(words2)]);

  return union.size > 0 ? intersection.length / union.size : 0.0;
}
