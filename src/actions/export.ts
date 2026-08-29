"use server";

import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getRequiredUserId } from "@/lib/auth/session";
import { generateTransactionsPdf } from "@/lib/export/transactions-pdf";
import { endOfMonth, formatDate, formatDateInput, startOfMonth } from "@/lib/utils";

const exportPdfSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("current_month") }),
  z.object({
    mode: z.literal("custom"),
    dateFrom: z.string().min(1, "Start date is required."),
    dateTo: z.string().min(1, "End date is required."),
  }),
]);

export type ExportPdfInput = z.infer<typeof exportPdfSchema>;

function resolveExportRange(input: ExportPdfInput) {
  if (input.mode === "current_month") {
    const start = startOfMonth();
    const end = endOfMonth();
    const label = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
    }).format(start);
    return { start, end, label };
  }

  const start = new Date(`${input.dateFrom}T00:00:00`);
  const end = new Date(`${input.dateTo}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid date range.");
  }
  if (start > end) {
    throw new Error("Start date must be before end date.");
  }

  const label = `${formatDate(start)} – ${formatDate(end)}`;
  return { start, end, label };
}

/**
 * Exports transactions in a date range as a PDF.
 * Returns base64-encoded PDF for client-side download.
 */
export async function exportTransactionsPdfAction(input: ExportPdfInput): Promise<{
  success: boolean;
  pdf?: string;
  filename?: string;
  message?: string;
}> {
  try {
    const userId = await getRequiredUserId();
    const parsed = exportPdfSchema.safeParse(input);

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid export options." };
    }

    const { start, end, label } = resolveExportRange(parsed.data);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        transactionDate: { gte: start, lte: end },
      },
      orderBy: { transactionDate: "desc" },
      select: {
        type: true,
        amount: true,
        description: true,
        transactionDate: true,
        paymentMethod: true,
        category: { select: { name: true } },
      },
    });

    if (transactions.length === 0) {
      return { success: false, message: "No transactions found for the selected period." };
    }

    const pdfBuffer = await generateTransactionsPdf({
      periodLabel: label,
      transactions: transactions.map((t) => ({
        transactionDate: t.transactionDate,
        description: t.description,
        type: t.type,
        amount: t.amount.toNumber(),
        categoryName: t.category.name,
        paymentMethod: t.paymentMethod,
      })),
    });

    const safeLabel =
      parsed.data.mode === "current_month"
        ? `current_month_${formatDateInput(start)}`
        : `${parsed.data.dateFrom}_to_${parsed.data.dateTo}`;

    const filename = `finpulse_transactions_${safeLabel}.pdf`;
    const base64 = pdfBuffer.toString("base64");

    return { success: true, pdf: base64, filename };
  } catch (error) {
    console.error("[exportTransactionsPdf] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to export PDF.";
    return { success: false, message };
  }
}

/**
 * Exports all of the user's transactions as a CSV string.
 * Returns base64-encoded CSV so it can be downloaded client-side.
 */
export async function exportTransactionsCsvAction(): Promise<{
  success: boolean;
  csv?: string;
  filename?: string;
  message?: string;
}> {
  try {
    const userId = await getRequiredUserId();

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: "desc" },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        transactionDate: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });

    if (transactions.length === 0) {
      return { success: false, message: "No transactions to export." };
    }

    const headers = ["Date", "Type", "Amount (INR)", "Description", "Category", "Payment Method", "Notes", "ID"];

    const rows = transactions.map((t) => [
      new Date(t.transactionDate).toLocaleDateString("en-IN"),
      t.type,
      t.amount.toFixed(2),
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.category.name.replace(/"/g, '""')}"`,
      t.paymentMethod ?? "",
      `"${(t.notes ?? "").replace(/"/g, '""')}"`,
      t.id,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const filename = `transactions_${new Date().toISOString().split("T")[0]}.csv`;

    // Return as base64 so it's safe to transfer across the server-client boundary
    const base64 = Buffer.from(csvContent, "utf-8").toString("base64");

    return { success: true, csv: base64, filename };
  } catch (error) {
    console.error("[exportTransactionsCsv] Error:", error);
    return { success: false, message: "Failed to export transactions." };
  }
}

/**
 * Deletes ALL transactions for the user. Irreversible.
 */
export async function deleteAllTransactionsAction(): Promise<{
  success: boolean;
  count?: number;
  message?: string;
}> {
  try {
    const userId = await getRequiredUserId();

    const result = await prisma.transaction.deleteMany({ where: { userId } });

    // Also clear derived data
    await prisma.recurringTransaction.deleteMany({ where: { userId } });
    await prisma.statementImport.deleteMany({ where: { userId } });

    return {
      success: true,
      count: result.count,
      message: `Deleted ${result.count} transaction${result.count !== 1 ? "s" : ""}.`,
    };
  } catch (error) {
    console.error("[deleteAllTransactions] Error:", error);
    return { success: false, message: "Failed to delete transactions." };
  }
}
