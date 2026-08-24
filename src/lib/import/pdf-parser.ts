import type { ParsedRawTransaction, ParseResult } from "./csv-parser";

/**
 * Extracts text from a PDF Buffer using pdf-parse and extracts bank transactions.
 */
export async function parseBankStatementPdfBuffer(buffer: Buffer): Promise<ParseResult> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require("pdf-parse");
    let extractedText = "";

    // pdf-parse v2+ (Class based API)
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const textResult = await parser.getText();
      extractedText = typeof textResult === "string" ? textResult : textResult.text || "";
      await parser.destroy();
    }
    // pdf-parse v1 (Function based API)
    else if (typeof pdfModule === "function") {
      const data = await pdfModule(buffer);
      extractedText = data.text || "";
    } else if (typeof pdfModule.default === "function") {
      const data = await pdfModule.default(buffer);
      extractedText = data.text || "";
    }

    if (!extractedText.trim()) {
      return {
        success: false,
        transactions: [],
        totalRowsParsed: 0,
        error: "No text could be extracted from this PDF. It may be an image-only scanned document.",
      };
    }

    return parseBankStatementPdfText(extractedText);
  } catch (error) {
    console.error("PDF Parsing library error:", error);
    return {
      success: false,
      transactions: [],
      totalRowsParsed: 0,
      error: "Failed to read binary PDF content. The file might be password-protected or corrupted.",
    };
  }
}

/**
 * Parses raw text extracted from bank statement PDFs.
 * Identifies transaction lines using regex patterns for dates, descriptions, and debits/credits.
 */
export function parseBankStatementPdfText(text: string): ParseResult {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { success: false, transactions: [], totalRowsParsed: 0, error: "The PDF document contains no readable text." };
  }

  const transactions: ParsedRawTransaction[] = [];
  let totalRowsParsed = 0;

  // Multi-format date regex:
  // - 01/08/2024, 01-08-2024, 01/08/24
  // - 01 Aug 2024, 01-Aug-2024, 01 Aug 24
  // - 2024-08-01, 2024/08/01
  const datePattern = /(?:^|\s)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}[-\s]+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-\s]+\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})(?:\s|$)/i;

  // Monetary amount pattern: e.g. 1,450.00 or 500.50 (with optional Cr/Dr or +/-)
  const amountRegex = /(?:^|\s)(?:Rs\.?|INR|₹)?\s*([+-]?\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})|\d+(?:\.\d{1,2}))\s*(CR|DR|Cr|Dr)?(?:\s|$)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line contains a valid date
    const dateMatch = datePattern.exec(line);
    if (!dateMatch) continue;

    const rawDateStr = dateMatch[1].trim();
    const parsedDate = parsePdfDate(rawDateStr);
    if (!parsedDate) continue;

    totalRowsParsed++;

    // Find all amount occurrences on this line
    const amountMatches = Array.from(line.matchAll(amountRegex));
    if (amountMatches.length === 0) {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextAmounts = Array.from(nextLine.matchAll(amountRegex));
        if (nextAmounts.length > 0) {
          const combinedLine = `${line} ${nextLine}`;
          const parsed = extractTransactionFromLine(combinedLine, rawDateStr, parsedDate, nextAmounts);
          if (parsed) {
            transactions.push(parsed);
            i++; // skip next line
            continue;
          }
        }
      }
      continue;
    }

    const parsed = extractTransactionFromLine(line, rawDateStr, parsedDate, amountMatches);
    if (parsed) {
      transactions.push(parsed);
    }
  }

  return {
    success: transactions.length > 0,
    transactions,
    totalRowsParsed,
    detectedFormat: "PDF Bank Statement",
  };
}

function extractTransactionFromLine(
  line: string,
  rawDateStr: string,
  parsedDate: Date,
  amounts: RegExpMatchArray[]
): ParsedRawTransaction | null {
  let amount = 0;
  let type: "INCOME" | "EXPENSE" = "EXPENSE";

  const numValues = amounts.map((m) => {
    const cleanNum = m[1].replace(/[,\s]/g, "");
    const indicator = (m[2] || "").toUpperCase();
    return {
      val: parseFloat(cleanNum),
      indicator,
      fullMatch: m[0],
    };
  }).filter((m) => !isNaN(m.val) && m.val > 0);

  if (numValues.length === 0) return null;

  const upperLine = line.toUpperCase();
  const isCreditContext =
    upperLine.includes(" CR") ||
    upperLine.includes("CR-") ||
    upperLine.includes("CREDIT") ||
    upperLine.includes("DEPOSIT") ||
    upperLine.includes("SALARY") ||
    upperLine.includes("REFUND") ||
    upperLine.includes("INWARD");

  if (numValues.length === 1) {
    amount = numValues[0].val;
    const ind = numValues[0].indicator;
    if (ind === "CR" || isCreditContext) {
      type = "INCOME";
    } else {
      type = "EXPENSE";
    }
  } else {
    // When multiple numbers exist (e.g. Txn Amount & Balance)
    const first = numValues[0];
    amount = first.val;

    if (first.indicator === "CR" || isCreditContext) {
      type = "INCOME";
    } else {
      type = "EXPENSE";
    }
  }

  if (amount <= 0) return null;

  // Extract description: remove the date string and all amount tokens from line
  let desc = line.replace(rawDateStr, "");
  for (const m of amounts) {
    desc = desc.replace(m[0], " ");
  }

  // Also strip any residual trailing floating point numbers / balances from description
  desc = desc.replace(/\b\d+(?:\.\d{2})\b/g, " ");

  // Clean description
  desc = desc
    .replace(/^[\s/:-]+/, "")
    .replace(/[\s/:-]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!desc || desc.length < 2) {
    desc = type === "INCOME" ? "Inward Credit" : "Bank Debit";
  }

  return {
    date: parsedDate,
    rawDateStr,
    description: desc,
    amount,
    type,
    paymentMethod: detectPaymentMethod(desc),
  };
}

function parsePdfDate(str: string): Date | null {
  if (!str) return null;
  const clean = str.trim().replace(/['"]/g, "");

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const ddmmyyyy = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/.exec(clean);
  if (ddmmyyyy) {
    const [, day, month, rawYear] = ddmmyyyy;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD
  const yyyymmdd = /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/.exec(clean);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(d.getTime()) ? null : d;
  }

  // DD-MMM-YYYY or DD MMM YYYY (e.g. 05 Aug 2024)
  const d = new Date(clean.replace(/-/g, " "));
  return isNaN(d.getTime()) ? null : d;
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
