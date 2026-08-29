import { getCategories } from "@/lib/db/categories";
import { getCategoryHistory } from "@/lib/db/transactions";
import { getCategoryRulesForEngine } from "@/lib/db/category-rules";
import { categorizeTransaction } from "@/lib/categorization/engine";
import { buildCategoryHistory } from "@/lib/categorization/history";
import { detectDuplicates } from "@/lib/import/duplicate-detector";
import { classifyTransaction } from "@/lib/finance/classification";
import { findCrossSourceDuplicates } from "@/lib/finance/deduplication";
import { parseBankStatementCsv } from "@/lib/import/csv-parser";
import { parseBankStatementPdfBuffer } from "@/lib/import/pdf-parser";
import type { AnalyzedTransaction } from "@/actions/import";
import type { ParseResult } from "@/lib/import/csv-parser";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ParsedStatementResult {
  success: boolean;
  message: string;
  fileName?: string;
  totalParsed?: number;
  duplicateCount?: number;
  detectedFormat?: string;
  errorCode?: "PASSWORD_REQUIRED" | "PASSWORD_INCORRECT";
  transactions?: AnalyzedTransaction[];
}

function getFileKind(fileName: string): "csv" | "pdf" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}

async function parseStatementFile(
  file: File,
  options?: { pdfPassword?: string }
): Promise<{ fileName: string; parseResult: ParseResult }> {
  const fileName = file.name;
  const kind = getFileKind(fileName);

  if (!kind) {
    return {
      fileName,
      parseResult: {
        success: false,
        transactions: [],
        totalRowsParsed: 0,
        error: "Unsupported file format. Please upload a .csv or .pdf statement.",
      },
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      fileName,
      parseResult: {
        success: false,
        transactions: [],
        totalRowsParsed: 0,
        error: "File is too large. Maximum supported size is 10 MB.",
      },
    };
  }

  if (kind === "csv") {
    const text = await file.text();
    return { fileName, parseResult: parseBankStatementCsv(text) };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    fileName,
    parseResult: await parseBankStatementPdfBuffer(buffer, options?.pdfPassword),
  };
}

export async function analyzeStatementFile(
  userId: string,
  file: File,
  options?: { pdfPassword?: string }
): Promise<ParsedStatementResult> {
  if (!file || file.size === 0) {
    return { success: false, message: "Please select a CSV or PDF file to upload." };
  }

  try {
    const { fileName, parseResult } = await parseStatementFile(file, options);

    if (!parseResult.success || parseResult.transactions.length === 0) {
      return {
        success: false,
        message: parseResult.error ?? "No valid transactions could be found in this file.",
        errorCode: parseResult.errorCode,
        fileName,
      };
    }

    const [categories, pastTransactions, userRules] = await Promise.all([
      getCategories(userId),
      getCategoryHistory(userId),
      getCategoryRulesForEngine(userId),
    ]);
    const categoryHistory = buildCategoryHistory(pastTransactions);
    const duplicates = await detectDuplicates(userId, parseResult.transactions);

    const crossSourceItems = parseResult.transactions.map((tx) => {
      const cls = classifyTransaction(tx.description, tx.type, tx.paymentMethod);
      return {
        amount: tx.amount,
        date: tx.date,
        description: tx.description,
        merchantName: cls.merchantName,
        type: tx.type,
      };
    });
    const crossSourceDupes = await findCrossSourceDuplicates(userId, crossSourceItems);
    const crossSourceSet = new Set(crossSourceDupes.map((d) => d.parsedIndex));

    let duplicateCount = 0;
    const transactions: AnalyzedTransaction[] = parseResult.transactions.map((tx, idx) => {
      const categorization = categorizeTransaction(tx.description, tx.type, categories, {
        history: categoryHistory,
        userRules,
      });
      const dup = duplicates[idx] ?? { isDuplicate: false, duplicateConfidence: 0 };
      const isCrossSourceDupe = crossSourceSet.has(idx);
      const isDupe = dup.isDuplicate || isCrossSourceDupe;
      if (isDupe) duplicateCount++;

      const classification = classifyTransaction(tx.description, tx.type, tx.paymentMethod);

      return {
        id: `row-${idx}-${Date.now()}`,
        date: tx.date.toISOString(),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        paymentMethod: tx.paymentMethod,
        referenceNo: tx.referenceNo,
        selected: !isDupe,
        categorization,
        duplicateInfo: isCrossSourceDupe
          ? { ...dup, isDuplicate: true, duplicateConfidence: 90, reason: "Cross-source duplicate detected" }
          : dup,
        transactionKind: classification.kind,
        merchantName: classification.merchantName,
        excludeFromTotals: classification.excludeFromTotals,
      };
    });

    return {
      success: true,
      message: `Parsed ${transactions.length} transactions from ${fileName}.`,
      fileName,
      totalParsed: transactions.length,
      duplicateCount,
      detectedFormat: parseResult.detectedFormat,
      transactions,
    };
  } catch (error) {
    console.error("[import] Statement parse error:", error);
    return { success: false, message: "Failed to read or parse the statement file." };
  }
}
