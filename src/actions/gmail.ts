"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getAuthenticatedGmailClient } from "@/lib/gmail/client";
import { fetchTransactionsFromGmail } from "@/lib/gmail/fetcher";
import { categorizeTransaction } from "@/lib/categorization/engine";
import { getCategories } from "@/lib/db/categories";
import { getCategoryRulesForEngine } from "@/lib/db/category-rules";

export interface GmailConnectionStatus {
  connected: boolean;
  email: string | null;
  lastSyncAt: Date | null;
}

/**
 * Retrieves the current user's Gmail connection status
 */
export async function getGmailConnectionStatusAction(): Promise<GmailConnectionStatus> {
  const userId = await getRequiredUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleConnected: true,
      googleEmail: true,
      lastGmailSyncAt: true,
    },
  });

  return {
    connected: user?.googleConnected ?? false,
    email: user?.googleEmail ?? null,
    lastSyncAt: user?.lastGmailSyncAt ?? null,
  };
}

export type SyncTimeRange = "CURRENT_MONTH" | "7" | "15" | "30" | "60" | "90" | "180" | "365";

/**
 * Syncs bank alert emails from Gmail and saves new transactions into DB
 */
export async function syncGmailTransactionsAction(range: SyncTimeRange = "CURRENT_MONTH"): Promise<{
  success: boolean;
  importedCount: number;
  duplicateCount: number;
  message: string;
}> {
  const userId = await getRequiredUserId();

  try {
    const { gmail } = await getAuthenticatedGmailClient(userId);

    const now = new Date();
    let fromDate: Date;

    if (range === "CURRENT_MONTH") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      const days = parseInt(range, 10) || 30;
      fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const fetchedItems = await fetchTransactionsFromGmail(gmail, fromDate, 300);

    if (fetchedItems.length === 0) {
      // Update last sync time even if 0 items found
      await prisma.user.update({
        where: { id: userId },
        data: { lastGmailSyncAt: new Date() },
      });

      revalidatePath("/import");
      return {
        success: true,
        importedCount: 0,
        duplicateCount: 0,
        message: "No new bank transaction emails found.",
      };
    }

    // 2. Fetch existing transaction emailMessageIds to avoid duplicate entries
    const messageIds = fetchedItems.map((item) => item.emailMessageId);
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        emailMessageId: { in: messageIds },
      },
      select: { emailMessageId: true },
    });

    const existingIdSet = new Set(existingTransactions.map((t) => t.emailMessageId));
    const newItems = fetchedItems.filter((item) => !existingIdSet.has(item.emailMessageId));
    const duplicateCount = fetchedItems.length - newItems.length;

    if (newItems.length === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { lastGmailSyncAt: new Date() },
      });

      revalidatePath("/import");
      return {
        success: true,
        importedCount: 0,
        duplicateCount,
        message: `All ${fetchedItems.length} transactions from emails were already imported.`,
      };
    }

    // 3. Categorize new items
    const [categories, userRules] = await Promise.all([
      getCategories(userId),
      getCategoryRulesForEngine(userId),
    ]);

    const transactionData = newItems.map((item) => {
      const catResult = categorizeTransaction(item.description, item.type, categories, {
        userRules,
      });
      return {
        userId,
        type: item.type,
        amount: item.amount,
        description: item.description,
        categoryId: catResult.categoryId,
        transactionDate: item.transactionDate,
        paymentMethod: item.paymentMethod,
        source: "GMAIL",
        emailMessageId: item.emailMessageId,
        notes: `Imported automatically from Gmail (${item.rawMerchant})`,
      };
    });

    // 4. Batch insert into database
    await prisma.transaction.createMany({
      data: transactionData,
    });

    // 5. Update user last sync timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { lastGmailSyncAt: new Date() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/import");
    revalidatePath("/analytics");
    revalidatePath("/subscriptions");

    return {
      success: true,
      importedCount: newItems.length,
      duplicateCount,
      message: `Successfully synced ${newItems.length} transaction${newItems.length !== 1 ? "s" : ""} from Gmail${
        duplicateCount > 0 ? ` (${duplicateCount} duplicate${duplicateCount !== 1 ? "s" : ""} skipped)` : ""
      }.`,
    };
  } catch (error: any) {
    console.error("[syncGmailTransactionsAction] Error:", error);
    return {
      success: false,
      importedCount: 0,
      duplicateCount: 0,
      message: error?.message || "Failed to sync transactions from Gmail.",
    };
  }
}

/**
 * Disconnects the user's Google/Gmail account
 */
export async function disconnectGmailAction(): Promise<{ success: boolean; message: string }> {
  const userId = await getRequiredUserId();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleConnected: false,
        googleEmail: null,
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        lastGmailSyncAt: null,
      },
    });

    revalidatePath("/import");
    revalidatePath("/settings");

    return { success: true, message: "Gmail account disconnected." };
  } catch (err) {
    console.error("[disconnectGmailAction] Error:", err);
    return { success: false, message: "Failed to disconnect Gmail account." };
  }
}
