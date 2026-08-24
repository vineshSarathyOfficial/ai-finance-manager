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
  detectedFormat?: string;
}

/**
 * Parses raw CSV text into normalized bank transactions.
 * Supports HDFC, ICICI, SBI, Axis, and Generic bank CSV exports.
 */
export function parseBankStatementCsv(csvContent: string): ParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { success: false, transactions: [], totalRowsParsed: 0, error: "The CSV file is empty." };
  }

  // 1. Find the header row (skip preamble metadata lines often added by banks)
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const rowCells = parseCsvLine(lines[i]).map((c) => c.toLowerCase().trim());
    const hasDate = rowCells.some((c) => c.includes("date") || c.includes("txn dt") || c.includes("value dt"));
    const hasDesc = rowCells.some((c) => c.includes("narration") || c.includes("description") || c.includes("particular") || c.includes("details") || c.includes("remarks"));
    const hasAmount = rowCells.some((c) => c.includes("amount") || c.includes("withdrawal") || c.includes("deposit") || c.includes("debit") || c.includes("credit"));

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
      error: "Could not identify standard bank statement column headers (Date, Description/Narration, Amount/Debit/Credit).",
    };
  }

  // 2. Identify column indices
  const colDate = headers.findIndex((h) => h.includes("txn date") || h.includes("transaction date") || h.includes("date"));
  const colDesc = headers.findIndex((h) => h.includes("narration") || h.includes("description") || h.includes("particular") || h.includes("remarks") || h.includes("details"));
  const colDebit = headers.findIndex((h) => h.includes("withdrawal") || h.includes("debit") || h.includes("dr"));
  const colCredit = headers.findIndex((h) => h.includes("deposit") || h.includes("credit") || h.includes("cr") && !h.includes("description"));
  const colAmount = headers.findIndex((h) => h === "amount" || h.includes("txn amount") || h.includes("transaction amount"));
  const colType = headers.findIndex((h) => h === "type" || h.includes("cr/dr") || h.includes("dr/cr") || h.includes("transaction type"));
  const colRef = headers.findIndex((h) => h.includes("ref") || h.includes("chq") || h.includes("cheque") || h.includes("utr"));

  const transactions: ParsedRawTransaction[] = [];
  let totalRowsParsed = 0;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    if (row.length === 0 || row.every((c) => !c.trim())) continue;

    totalRowsParsed++;

    const dateStr = row[colDate] ?? "";
    const descStr = row[colDesc] ?? "";
    const parsedDate = parseDateString(dateStr);

    if (!parsedDate || !descStr.trim()) {
      continue; // Skip invalid or summary footer lines
    }

    let amount = 0;
    let type: "INCOME" | "EXPENSE" = "EXPENSE";

    // Format A: Separate Debit and Credit columns (Standard Indian Banking)
    if (colDebit !== -1 && colCredit !== -1) {
      const debitVal = cleanNumber(row[colDebit]);
      const creditVal = cleanNumber(row[colCredit]);

      if (debitVal > 0) {
        amount = debitVal;
        type = "EXPENSE";
      } else if (creditVal > 0) {
        amount = creditVal;
        type = "INCOME";
      } else {
        continue; // 0 amount or balance line
      }
    }
    // Format B: Single Amount column with separate Type column
    else if (colAmount !== -1 && colType !== -1) {
      const rawAmt = cleanNumber(row[colAmount]);
      const typeStr = (row[colType] ?? "").toUpperCase();
      type = typeStr.includes("CR") || typeStr.includes("INCOME") || typeStr.includes("DEPOSIT") ? "INCOME" : "EXPENSE";
      amount = Math.abs(rawAmt);
    }
    // Format C: Single signed Amount column (+ / -)
    else if (colAmount !== -1) {
      const rawCell = (row[colAmount] ?? "").trim();
      const numVal = cleanNumber(rawCell);
      if (rawCell.startsWith("-") || rawCell.toLowerCase().includes("dr")) {
        type = "EXPENSE";
        amount = Math.abs(numVal);
      } else if (rawCell.startsWith("+") || rawCell.toLowerCase().includes("cr")) {
        type = "INCOME";
        amount = Math.abs(numVal);
      } else {
        amount = Math.abs(numVal);
        type = "EXPENSE";
      }
    }

    if (amount <= 0 || isNaN(amount)) continue;

    const refNo = colRef !== -1 ? row[colRef]?.trim() : undefined;
    const paymentMethod = detectPaymentMethod(descStr);

    transactions.push({
      date: parsedDate,
      rawDateStr: dateStr,
      description: cleanDescription(descStr),
      amount,
      type,
      referenceNo: refNo,
      paymentMethod,
    });
  }

  return {
    success: transactions.length > 0,
    transactions,
    totalRowsParsed,
    detectedFormat: "Auto-detected Bank CSV",
  };
}

/**
 * Handles RFC4180 CSV line parsing with quotes, commas, and escapes.
 */
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

function parseDateString(str: string): Date | null {
  if (!str) return null;
  const clean = str.trim().split(" ")[0].replace(/['"]/g, "");

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(clean);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(clean);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // DD-MMM-YYYY (e.g. 15-Aug-2024)
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

function detectPaymentMethod(desc: string): string {
  const upper = desc.toUpperCase();
  if (upper.includes("UPI") || upper.includes("/UPI/")) return "UPI";
  if (upper.includes("POS ") || upper.includes("ECOM")) return "Debit Card";
  if (upper.includes("ATM ") || upper.includes("CASH WDL")) return "Cash";
  if (upper.includes("NEFT") || upper.includes("RTGS") || upper.includes("IMPS")) return "Net Banking";
  if (upper.includes("CHQ") || upper.includes("CHEQUE")) return "Cheque";
  return "Other";
}
