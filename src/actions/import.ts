"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateDefaultAccount, findOrCreateCreditCardAccount } from "@/lib/db/accounts";
import { analyzeStatementFile } from "@/lib/import/parse-statement";
import type { CategorizationResult } from "@/lib/categorization/engine";
import type { DuplicateCheckResult } from "@/lib/import/duplicate-detector";

export interface AnalyzedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  paymentMethod?: string;
  referenceNo?: string;
  selected: boolean;
  categorization: CategorizationResult;
  duplicateInfo: DuplicateCheckResult;
  transactionKind?: string;
  merchantName?: string;
  excludeFromTotals?: boolean;
}

export interface ParseStatementResponse {
  success: boolean;
  message: string;
  fileName?: string;
  totalParsed?: number;
  duplicateCount?: number;
  detectedFormat?: string;
  errorCode?: "PASSWORD_REQUIRED" | "PASSWORD_INCORRECT";
  transactions?: AnalyzedTransaction[];
}

export async function parseStatementAction(
  formData: FormData
): Promise<ParseStatementResponse> {
  const userId = await getRequiredUserId();
  const file = formData.get("file");
  const pdfPasswordRaw = formData.get("pdfPassword");
  const pdfPassword =
    typeof pdfPasswordRaw === "string" && pdfPasswordRaw.trim().length > 0
      ? pdfPasswordRaw.trim()
      : undefined;

  if (!file || !(file instanceof File)) {
    return { success: false, message: "Please select a CSV or PDF file to upload." };
  }

  return analyzeStatementFile(userId, file, { pdfPassword });
}

export interface CommitTransactionPayload {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  paymentMethod?: string;
  notes?: string;
  accountId?: string;
  merchantName?: string;
  transactionKind?: string;
  excludeFromTotals?: boolean;
}

export interface CommitImportPayload {
  fileName: string;
  source?: string;
  accountId?: string;
  isCreditCard?: boolean;
  creditCardName?: string;
  transactions: CommitTransactionPayload[];
  totalDuplicatesDetected?: number;
}

export async function commitImportAction(payload: CommitImportPayload) {
  const userId = await getRequiredUserId();

  if (!payload.transactions || payload.transactions.length === 0) {
    return { success: false, message: "No transactions were selected for import." };
  }

  try {
    let accountId = payload.accountId;
    if (!accountId) {
      const account = payload.isCreditCard
        ? await findOrCreateCreditCardAccount(userId, {
            name: payload.creditCardName,
          })
        : await getOrCreateDefaultAccount(userId);
      accountId = account.id;
    }

    const result = await prisma.$transaction(async (tx) => {
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
          accountId,
          merchantName: t.merchantName || null,
          transactionKind: (t.transactionKind as "REGULAR" | "TRANSFER" | "REFUND" | "CC_PAYMENT" | "EXCLUDED") || "REGULAR",
          excludeFromTotals: t.excludeFromTotals ?? false,
        })),
      });

      return statementImport;
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/analytics");
    revalidatePath("/import");
    revalidatePath("/credit-cards");

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
