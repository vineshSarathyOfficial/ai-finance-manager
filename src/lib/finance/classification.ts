import { extractMerchantKey } from "@/lib/categorization/narration";
import type { TransactionKind } from "@prisma/client";

const CC_PAYMENT_PATTERNS = [
  /payment\s+received/i,
  /cc\s*payment/i,
  /credit\s*card\s*payment/i,
  /bill\s*payment.*credit/i,
  /autopay.*credit/i,
  /nach.*credit\s*card/i,
];

const TRANSFER_PATTERNS = [
  /\btransfer\b/i,
  /\bneft\s+to\b/i,
  /\bimps\s+to\b/i,
  /\bself\s+transfer\b/i,
  /\bown\s+account\b/i,
  /\bfund\s+transfer\b/i,
  /\bift\b/i,
];

const REFUND_PATTERNS = [
  /\brefund\b/i,
  /\breversal\b/i,
  /\bcashback\b/i,
  /\bchargeback\b/i,
  /\bcredit\s+note\b/i,
  /\breversed\b/i,
];

export function classifyTransaction(
  description: string,
  type: "INCOME" | "EXPENSE",
  paymentMethod?: string | null
): { kind: TransactionKind; excludeFromTotals: boolean; merchantName: string } {
  const merchantName = extractMerchantKey(description);
  const desc = description.toLowerCase();

  if (CC_PAYMENT_PATTERNS.some((p) => p.test(desc))) {
    return { kind: "CC_PAYMENT", excludeFromTotals: true, merchantName };
  }

  if (TRANSFER_PATTERNS.some((p) => p.test(desc))) {
    return { kind: "TRANSFER", excludeFromTotals: true, merchantName };
  }

  if (type === "INCOME" && REFUND_PATTERNS.some((p) => p.test(desc))) {
    return { kind: "REFUND", excludeFromTotals: false, merchantName };
  }

  if (paymentMethod?.toLowerCase().includes("credit card") && type === "INCOME") {
    return { kind: "CC_PAYMENT", excludeFromTotals: true, merchantName };
  }

  return { kind: "REGULAR", excludeFromTotals: false, merchantName };
}

export function buildDedupKey(amount: number, date: Date, merchantName: string): string {
  const dateStr = date.toISOString().slice(0, 10);
  return `${amount.toFixed(2)}|${dateStr}|${merchantName}`;
}
