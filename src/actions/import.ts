"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getCategories } from "@/lib/db/categories";
import { parseBankStatementCsv } from "@/lib/import/csv-parser";
import { parseBankStatementPdfBuffer } from "@/lib/import/pdf-parser";
import { categorizeTransaction } from "@/lib/categorization/engine";
import { detectDuplicates } from "@/lib/import/duplicate-detector";
import type { CategorizationResult } from "@/lib/categorization/engine";
import type { DuplicateCheckResult } from "@/lib/import/duplicate-detector";

export interface AnalyzedTransaction {
  id: string; // temporary client key
  date: string; // ISO string
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  paymentMethod?: string;
  referenceNo?: string;
  selected: boolean;
  categorization: CategorizationResult;
  duplicateInfo: DuplicateCheckResult;
}

export interface ParseStatementResponse {
  success: boolean;
  message: string;
  fileName?: string;
  totalParsed?: number;
  duplicateCount?: number;
  transactions?: AnalyzedTransaction[];
}

export async function parseStatementAction(
  formData: FormData
): Promise<ParseStatementResponse> {
  const userId = await getRequiredUserId();
  const file = formData.get("file") as File | null;

  if (!file) {
    return { success: false, message: "Please select a CSV or PDF file to upload." };
  }

  const fileName = file.name;
  const isCsv = fileName.toLowerCase().endsWith(".csv");
  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  if (!isCsv && !isPdf) {
    return { success: false, message: "Unsupported file format. Please upload a .csv or .pdf statement." };
  }

  try {
    let parseResult;
    if (isCsv) {
      const textContent = await file.text();
      parseResult = parseBankStatementCsv(textContent);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      parseResult = await parseBankStatementPdfBuffer(buffer);
    }

    if (!parseResult.success || parseResult.transactions.length === 0) {
      return {
        success: false,
        message: parseResult.error ?? "No valid transactions could be found in this file.",
      };
    }

    const categories = await getCategories(userId);
    const duplicates = await detectDuplicates(userId, parseResult.transactions);

    let duplicateCount = 0;
    const analyzed: AnalyzedTransaction[] = parseResult.transactions.map((tx, idx) => {
      const categorization = categorizeTransaction(tx.description, tx.type, categories);
      const dup = duplicates[idx] ?? { isDuplicate: false, duplicateConfidence: 0 };
      if (dup.isDuplicate) duplicateCount++;

      return {
        id: `row-${idx}-${Date.now()}`,
        date: tx.date.toISOString(),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        paymentMethod: tx.paymentMethod,
        referenceNo: tx.referenceNo,
        selected: !dup.isDuplicate, // auto-deselect duplicates by default
        categorization,
        duplicateInfo: dup,
      };
    });

    return {
      success: true,
      message: `Parsed ${analyzed.length} transactions from ${fileName}.`,
      fileName,
      totalParsed: analyzed.length,
      duplicateCount,
      transactions: analyzed,
    };
  } catch (error) {
    console.error("Statement parse error:", error);
    return { success: false, message: "Failed to read or parse the statement file." };
  }
}

export interface CommitTransactionPayload {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  paymentMethod?: string;
  notes?: string;
}

export interface CommitImportPayload {
  fileName: string;
  source?: string;
  transactions: CommitTransactionPayload[];
  totalDuplicatesDetected?: number;
}

export async function commitImportAction(payload: CommitImportPayload) {
  const userId = await getRequiredUserId();

  if (!payload.transactions || payload.transactions.length === 0) {
    return { success: false, message: "No transactions were selected for import." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create StatementImport history record
      const statementImport = await tx.statementImport.create({
        data: {
          userId,
          fileName: payload.fileName,
          source: payload.source || "Bank Statement",
          status: "PROCESSED",
          importedCount: payload.transactions.length,
          duplicateCount: payload.totalDuplicatesDetected || 0,
        },
      });

      // 2. Insert all transactions linked to importId
      await tx.transaction.createMany({
        data: payload.transactions.map((t) => ({
          userId,
          type: t.type,
          amount: t.amount,
          description: t.description,
          categoryId: t.categoryId,
          transactionDate: new Date(t.date),
          paymentMethod: t.paymentMethod || null,
          notes: t.notes ? `${t.notes} (Imported)` : "Imported from statement",
          importId: statementImport.id,
        })),
      });

      return statementImport;
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/analytics");
    revalidatePath("/import");

    return {
      success: true,
      message: `Successfully imported ${payload.transactions.length} transactions.`,
      importId: result.id,
    };
  } catch (error) {
    console.error("Import commit error:", error);
    return { success: false, message: "Failed to save imported transactions to the database." };
  }
}

export async function getStatementImports(userId: string) {
  return prisma.statementImport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
