import {
  detectStatementKind,
  inferCreditCardTransactionType,
  isSkippableStatementRow,
  parseDrCrIndicator,
  resolvePaymentMethod,
  type StatementKind,
} from "./statement-utils";

export interface ParsedRawTransaction {
  date: Date;
  rawDateStr: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  referenceNo?: string;
  paymentMethod?: string;
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedRawTransaction[];
  totalRowsParsed: number;
  error?: string;
  errorCode?: "PASSWORD_REQUIRED" | "PASSWORD_INCORRECT";
  detectedFormat?: string;
}

/**
 * Parses raw CSV text into normalized transactions.
 * Supports bank and credit card CSV exports (HDFC, ICICI, SBI, Axis, etc.).
 */
export function parseBankStatementCsv(csvContent: string): ParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { success: false, transactions: [], totalRowsParsed: 0, error: "The CSV file is empty." };
  }

  const preamble = lines.slice(0, 15).join(" ");

  // 1. Find the header row (skip preamble metadata lines)
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const rowCells = parseCsvLine(lines[i]).map((c) => c.toLowerCase().trim());
    const hasDate = rowCells.some(
      (c) =>
        c.includes("date") ||
        c.includes("txn dt") ||
        c.includes("value dt") ||
        c.includes("posting date") ||
        c.includes("posted date")
    );
    const hasDesc = rowCells.some(
      (c) =>
        c.includes("narration") ||
        c.includes("description") ||
        c.includes("particular") ||
        c.includes("details") ||
        c.includes("remarks") ||
        c.includes("merchant")
    );
    const hasAmount = rowCells.some(
      (c) =>
        c.includes("amount") ||
        c.includes("withdrawal") ||
        c.includes("deposit") ||
        c.includes("debit") ||
        c.includes("credit")
    );

    if (hasDate && (hasDesc || hasAmount)) {
      headerIndex = i;
      headers = rowCells;
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      success: false,
      transactions: [],
      totalRowsParsed: 0,
      error:
        "Could not identify statement column headers (Date, Description/Merchant, Amount/Debit/Credit).",
    };
  }

  const statementKind = detectStatementKind(headers, preamble);

  // 2. Identify column indices
  const colDate = findColumnIndex(
    headers,
    [
      "transaction date",
      "txn date",
      "trans date",
      "purchase date",
      "posting date",
      "posted date",
      "post date",
      "date",
    ],
    ["value date", "value dt"]
  );
  const colMerchant = headers.findIndex((h) => h.includes("merchant"));
  const colDesc = headers.findIndex(
    (h) =>
      h.includes("narration") ||
      h.includes("description") ||
      h.includes("particular") ||
      h.includes("remarks") ||
      (h.includes("details") && !h.includes("card"))
  );
  const colIndicator = findIndicatorColumn(headers);
  const colDebitAmt = findDebitAmountColumn(headers);
  const colCreditAmt = findCreditAmountColumn(headers);
  const colAmount = findColumnIndex(
    headers,
    [
      "amount (in rs)",
      "amount in rs",
      "amount (inr)",
      "amount in inr",
      "transaction amount",
      "txn amount",
      "domestic amount",
      "amount",
    ],
    ["reward", "points", "intl", "international", "cashback", "closing", "opening"]
  );
  const colType = headers.findIndex(
    (h) =>
      (h === "type" || h.includes("transaction type")) &&
      !h.includes("debit") &&
      !h.includes("credit")
  );
  const colRef = headers.findIndex(
    (h) =>
      h.includes("ref") ||
      h.includes("chq") ||
      h.includes("cheque") ||
      h.includes("utr") ||
      h.includes("auth") ||
      h.includes("reference")
  );

  const transactions: ParsedRawTransaction[] = [];
  let totalRowsParsed = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 0 || row.every((c) => !c.trim())) continue;

    totalRowsParsed++;

    const dateStr = colDate !== -1 ? (row[colDate] ?? "") : "";
    const descStr = cleanDescription(
      (colMerchant !== -1 ? row[colMerchant] : "") ||
        (colDesc !== -1 ? row[colDesc] : "") ||
        ""
    );
    const parsedDate = parseDateString(dateStr);

    if (!parsedDate || isSkippableStatementRow(descStr, dateStr)) {
      continue;
    }

    if (!descStr.trim()) {
      continue;
    }

    const parsedAmount = parseRowAmount(
      row,
      { colIndicator, colDebitAmt, colCreditAmt, colAmount, colType },
      descStr,
      statementKind
    );

    if (!parsedAmount) continue;

    const refNo = colRef !== -1 ? row[colRef]?.trim() : undefined;
    const paymentMethod = resolvePaymentMethod(descStr, statementKind);

    transactions.push({
      date: parsedDate,
      rawDateStr: dateStr,
      description: descStr,
      amount: parsedAmount.amount,
      type: parsedAmount.type,
      referenceNo: refNo,
      paymentMethod,
    });
  }

  const formatLabel =
    statementKind === "CREDIT_CARD" ? "Auto-detected Credit Card CSV" : "Auto-detected Bank CSV";

  return {
    success: transactions.length > 0,
    transactions,
    totalRowsParsed,
    detectedFormat: formatLabel,
    error:
      transactions.length === 0
        ? "No valid transactions found. Check that the file is a bank or credit card statement export."
        : undefined,
  };
}

interface AmountColumns {
  colIndicator: number;
  colDebitAmt: number;
  colCreditAmt: number;
  colAmount: number;
  colType: number;
}

function parseRowAmount(
  row: string[],
  cols: AmountColumns,
  description: string,
  kind: StatementKind
): { amount: number; type: "INCOME" | "EXPENSE" } | null {
  const { colIndicator, colDebitAmt, colCreditAmt, colAmount, colType } = cols;

  // Credit card: single amount + D/C indicator column
  if (colIndicator !== -1 && colAmount !== -1) {
    const amount = cleanNumber(row[colAmount]);
    if (amount <= 0) return null;

    const type =
      parseDrCrIndicator(row[colIndicator], description, kind) ??
      (kind === "CREDIT_CARD" ? inferCreditCardTransactionType(description) : "EXPENSE");

    return { amount, type };
  }

  // Separate debit and credit amount columns (bank statements)
  if (colDebitAmt !== -1 && colCreditAmt !== -1) {
    const debitVal = cleanNumber(row[colDebitAmt]);
    const creditVal = cleanNumber(row[colCreditAmt]);

    if (debitVal > 0) return { amount: debitVal, type: "EXPENSE" };
    if (creditVal > 0) return { amount: creditVal, type: "INCOME" };
    return null;
  }

  if (colDebitAmt !== -1) {
    const debitVal = cleanNumber(row[colDebitAmt]);
    if (debitVal <= 0) return null;
    return { amount: debitVal, type: "EXPENSE" };
  }

  if (colCreditAmt !== -1) {
    const creditVal = cleanNumber(row[colCreditAmt]);
    if (creditVal <= 0) return null;
    return { amount: creditVal, type: "INCOME" };
  }

  // Single amount + type column
  if (colAmount !== -1 && colType !== -1) {
    const rawAmt = cleanNumber(row[colAmount]);
    if (rawAmt <= 0) return null;

    const typeStr = (row[colType] ?? "").toUpperCase();
    const type =
      typeStr.includes("CR") || typeStr.includes("CREDIT") || typeStr.includes("INCOME") || typeStr.includes("DEPOSIT")
        ? "INCOME"
        : "EXPENSE";

    return { amount: Math.abs(rawAmt), type };
  }

  // Single signed amount column
  if (colAmount !== -1) {
    const rawCell = (row[colAmount] ?? "").trim();
    const numVal = cleanNumber(rawCell);
    if (numVal <= 0) return null;

    if (rawCell.startsWith("-") || rawCell.toLowerCase().includes("dr")) {
      return { amount: Math.abs(numVal), type: "EXPENSE" };
    }
    if (rawCell.startsWith("+") || rawCell.toLowerCase().includes("cr")) {
      return { amount: Math.abs(numVal), type: "INCOME" };
    }

    if (kind === "CREDIT_CARD") {
      return {
        amount: Math.abs(numVal),
        type: inferCreditCardTransactionType(description),
      };
    }

    return { amount: Math.abs(numVal), type: "EXPENSE" };
  }

  return null;
}

function findIndicatorColumn(headers: string[]): number {
  return headers.findIndex(
    (h) =>
      (h.includes("debit") && h.includes("credit")) ||
      h.includes("dr/cr") ||
      h.includes("cr/dr") ||
      h.includes("d/c") ||
      h.includes("debit/credit indicator") ||
      h.includes("dr/cr indicator")
  );
}

function findDebitAmountColumn(headers: string[]): number {
  return headers.findIndex(
    (h) =>
      (h.includes("withdrawal") ||
        h.includes("debit amt") ||
        h.includes("debit amount") ||
        (h.includes("debit") && h.includes("amt"))) &&
      !h.includes("indicator") &&
      !h.includes("credit")
  );
}

function findCreditAmountColumn(headers: string[]): number {
  return headers.findIndex(
    (h) =>
      (h.includes("deposit") ||
        h.includes("credit amt") ||
        h.includes("credit amount") ||
        (h.includes("credit") && h.includes("amt"))) &&
      !h.includes("indicator") &&
      !h.includes("debit")
  );
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

function findColumnIndex(headers: string[], preferred: string[], excluded: string[] = []): number {
  for (const label of preferred) {
    const idx = headers.findIndex(
      (h) => h.includes(label) && !excluded.some((ex) => h.includes(ex))
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseDateString(str: string): Date | null {
  if (!str) return null;
  const clean = str.trim().split(" ")[0].replace(/['"]/g, "");

  const ddmmyyyy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(clean);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  const yyyymmdd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(clean);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

function cleanNumber(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[₹$,\s]/g, "").replace(/(?:CR|DR)$/i, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function cleanDescription(desc: string): string {
  return desc
    .replace(/^[\s/:-]+/, "")
    .replace(/[\s/:-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}
