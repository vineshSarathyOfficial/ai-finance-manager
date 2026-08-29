import "server-only";
import { prisma } from "@/lib/db/prisma";
import { buildDedupKey } from "./classification";

export interface DedupMatch {
  parsedIndex: number;
  existingId: string;
  reason: string;
}

export async function findCrossSourceDuplicates(
  userId: string,
  items: Array<{
    amount: number;
    date: Date;
    description: string;
    merchantName: string;
    type: "INCOME" | "EXPENSE";
  }>
): Promise<DedupMatch[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const existing = await prisma.transaction.findMany({
    where: { userId, transactionDate: { gte: since } },
    select: {
      id: true,
      amount: true,
      transactionDate: true,
      description: true,
      merchantName: true,
      type: true,
    },
  });

  const existingKeys = new Map<string, string>();
  for (const tx of existing) {
    const merchant = tx.merchantName || tx.description;
    const key = buildDedupKey(tx.amount.toNumber(), tx.transactionDate, merchant);
    existingKeys.set(key, tx.id);
  }

  const matches: DedupMatch[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = buildDedupKey(item.amount, item.date, item.merchantName);

    if (existingKeys.has(key)) {
      matches.push({
        parsedIndex: i,
        existingId: existingKeys.get(key)!,
        reason: "Exact match on amount, date, and merchant",
      });
      continue;
    }

    for (const tx of existing) {
      if (tx.type !== item.type) continue;
      const amtDiff = Math.abs(tx.amount.toNumber() - item.amount);
      if (amtDiff > 0.01) continue;

      const daysDiff = Math.abs(
        (tx.transactionDate.getTime() - item.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 3) continue;

      const txMerchant = tx.merchantName || tx.description;
      if (
        txMerchant.includes(item.merchantName) ||
        item.merchantName.includes(txMerchant) ||
        similarity(tx.description, item.description) > 0.5
      ) {
        matches.push({
          parsedIndex: i,
          existingId: tx.id,
          reason: "Similar amount, date, and description",
        });
        break;
      }
    }
  }

  return matches;
}

function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}
