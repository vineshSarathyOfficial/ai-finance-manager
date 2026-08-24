"use server";

import { prisma } from "@/lib/db/prisma";
import { getRequiredUserId } from "@/lib/auth/session";

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
