export type StatementKind = "BANK" | "CREDIT_CARD";

const CC_CREDIT_PATTERNS =
  /\b(?:payment received|autopay|auto[\s-]?pay|bill payment|payment thank|payment towards|cc payment|credit card payment|refund|reversal|cashback|chargeback|payment credited)\b/i;

const SKIP_ROW_PATTERNS =
  /^(?:total|sub[\s-]?total|opening balance|closing balance|minimum amount due|total amount due|payment due|credit limit|available (?:credit|cash)|previous balance|summary|grand total|statement period|card number|card no)/i;

export function detectStatementKind(headers: string[], preamble = ""): StatementKind {
  const headerText = headers.join(" ");
  const context = `${preamble} ${headerText}`.toLowerCase();

  if (
    context.includes("credit card") ||
    context.includes("card statement") ||
    context.includes("card account") ||
    headerText.includes("merchant") ||
    headerText.includes("reward point") ||
    headerText.includes("debit/credit indicator") ||
    headerText.includes("dr/cr indicator") ||
    headerText.includes("card no")
  ) {
    return "CREDIT_CARD";
  }

  return "BANK";
}

export function detectPdfStatementKind(text: string): StatementKind {
  const sample = text.slice(0, 4000).toLowerCase();
  if (
    sample.includes("credit card") ||
    sample.includes("card statement") ||
    sample.includes("card account") ||
    sample.includes("payment due date") ||
    sample.includes("minimum amount due") ||
    sample.includes("domestic transactions") ||
    (sample.includes("hdfc") && sample.includes("billedstatement")) ||
    /\bcard\s*no\.?\s*x+\d{4}/i.test(sample)
  ) {
    return "CREDIT_CARD";
  }
  return "BANK";
}

export function isSkippableStatementRow(description: string, dateStr = ""): boolean {
  const desc = description.trim();
  if (!desc && !dateStr.trim()) return true;
  if (!desc) return false;

  if (SKIP_ROW_PATTERNS.test(desc)) return true;
  if (/amount due|payment due date|total outstanding/i.test(desc)) return true;
  if (/^\d{4}\s*x+\d{4}$/i.test(desc)) return true;

  return false;
}

export function inferCreditCardTransactionType(description: string): "INCOME" | "EXPENSE" {
  return CC_CREDIT_PATTERNS.test(description) ? "INCOME" : "EXPENSE";
}

export function parseDrCrIndicator(
  indicator: string | undefined,
  description: string,
  kind: StatementKind
): "INCOME" | "EXPENSE" | null {
  const ind = (indicator ?? "").trim().toUpperCase();
  if (!ind) return null;

  if (ind === "C" || ind === "CR" || ind === "CREDIT" || ind.startsWith("CR")) return "INCOME";
  if (ind === "D" || ind === "DR" || ind === "DEBIT" || ind.startsWith("DR")) return "EXPENSE";

  if (kind === "CREDIT_CARD") {
    return inferCreditCardTransactionType(description);
  }

  return null;
}

export function resolvePaymentMethod(description: string, kind: StatementKind): string {
  if (kind === "CREDIT_CARD") return "Credit Card";

  const upper = description.toUpperCase();
  if (upper.includes("UPI") || upper.includes("/UPI/")) return "UPI";
  if (upper.includes("POS ") || upper.includes("ECOM")) return "Debit Card";
  if (upper.includes("ATM ") || upper.includes("CASH WDL")) return "Cash";
  if (upper.includes("NEFT") || upper.includes("RTGS") || upper.includes("IMPS")) return "Net Banking";
  if (upper.includes("CHQ") || upper.includes("CHEQUE")) return "Cheque";
  return "Other";
}
