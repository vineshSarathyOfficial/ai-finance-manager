"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { getRequiredUserId } from "@/lib/auth/session";
import { detectRecurringPatterns } from "@/lib/recurring/detector";
import type { Frequency } from "@prisma/client";

/** Serialized shape of a recurring item — safe to pass to Client Components */
export interface SerializedRecurringItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  frequency: Frequency;
  nextDueDate: Date | null;
  isActive: boolean;
  matchKey: string;
}

export interface RecurringSummary {
  totalMonthlyExpense: number;
  totalMonthlyIncome: number;
  activeCount: number;
  dueThisWeek: SerializedRecurringItem[];
}

// ---------------------------------------------------------------------------
// Sync: detect + upsert into DB
// ---------------------------------------------------------------------------
export async function syncRecurringTransactionsAction(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const userId = await getRequiredUserId();

  try {
    const patterns = await detectRecurringPatterns(userId);

    if (patterns.length === 0) {
      return { success: true, count: 0, message: "No recurring patterns detected yet. Add more transactions to enable detection." };
    }

    // Upsert each detected pattern
    await prisma.$transaction(
      patterns.map((p) =>
        prisma.recurringTransaction.upsert({
          where: { userId_matchKey: { userId, matchKey: p.matchKey } },
          create: {
            userId,
            name: p.name,
            type: p.type,
            amount: p.amount,
            frequency: p.frequency,
            nextDueDate: p.nextDueDate,
            lastSeenAt: p.lastSeenAt,
            occurrences: p.occurrences,
            confidence: p.confidence,
            matchKey: p.matchKey,
            categoryId: p.categoryId,
            isActive: true,
          },
          update: {
            name: p.name,
            amount: p.amount,
            frequency: p.frequency,
            nextDueDate: p.nextDueDate,
            lastSeenAt: p.lastSeenAt,
            occurrences: p.occurrences,
            confidence: p.confidence,
            categoryId: p.categoryId,
            updatedAt: new Date(),
          },
        })
      )
    );

    revalidatePath("/subscriptions");
    revalidatePath("/dashboard");

    return {
      success: true,
      count: patterns.length,
      message: `Detected ${patterns.length} recurring transaction${patterns.length !== 1 ? "s" : ""}.`,
    };
  } catch (error) {
    console.error("[syncRecurring] Error:", error);
    return { success: false, count: 0, message: "Failed to detect recurring transactions." };
  }
}

// ---------------------------------------------------------------------------
// Get all recurring for user
// ---------------------------------------------------------------------------
export async function getRecurringTransactions(userId: string): Promise<
  Array<{
    id: string;
    userId: string;
    name: string;
    type: "INCOME" | "EXPENSE";
    amount: number;
    frequency: Frequency;
    nextDueDate: Date | null;
    lastSeenAt: Date | null;
    isActive: boolean;
    matchKey: string;
    occurrences: number;
    confidence: number;
    categoryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    category: { name: string; icon: string | null } | null;
  }>
> {
  const rows = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true },
    include: { category: { select: { name: true, icon: true } } },
    orderBy: [{ confidence: "desc" }, { amount: "desc" }],
  });

  // Serialize Decimal → number so it's safe for Client Components
  return rows.map((r) => ({ ...r, amount: Number(r.amount) }));
}

// ---------------------------------------------------------------------------
// Summary stats for dashboard widget
// ---------------------------------------------------------------------------
export async function getRecurringSummary(userId: string): Promise<RecurringSummary> {
  const active = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true },
  });

  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  let totalMonthlyExpense = 0;
  let totalMonthlyIncome = 0;

  const toMonthly = (amount: number, freq: string): number => {
    switch (freq) {
      case "WEEKLY":    return amount * 52 / 12;
      case "BIWEEKLY":  return amount * 26 / 12;
      case "MONTHLY":   return amount;
      case "QUARTERLY": return amount / 3;
      case "YEARLY":    return amount / 12;
      default:          return amount;
    }
  };

  const dueThisWeek: SerializedRecurringItem[] = [];

  for (const r of active) {
    const monthly = toMonthly(Number(r.amount), r.frequency);
    if (r.type === "EXPENSE") totalMonthlyExpense += monthly;
    else totalMonthlyIncome += monthly;

    if (r.nextDueDate && r.nextDueDate >= now && r.nextDueDate <= weekFromNow) {
      dueThisWeek.push({
        id: r.id,
        name: r.name,
        type: r.type,
        amount: Number(r.amount),
        frequency: r.frequency,
        nextDueDate: r.nextDueDate,
        isActive: r.isActive,
        matchKey: r.matchKey,
      });
    }
  }

  return {
    totalMonthlyExpense: Math.round(totalMonthlyExpense * 100) / 100,
    totalMonthlyIncome: Math.round(totalMonthlyIncome * 100) / 100,
    activeCount: active.length,
    dueThisWeek,
  };
}

// ---------------------------------------------------------------------------
// Toggle active/inactive
// ---------------------------------------------------------------------------
export async function toggleRecurringActiveAction(id: string, isActive: boolean): Promise<void> {
  const userId = await getRequiredUserId();
  await prisma.recurringTransaction.updateMany({
    where: { id, userId },
    data: { isActive, updatedAt: new Date() },
  });
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------------
// Delete a recurring entry
// ---------------------------------------------------------------------------
export async function deleteRecurringAction(id: string): Promise<void> {
  const userId = await getRequiredUserId();
  await prisma.recurringTransaction.deleteMany({ where: { id, userId } });
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
}
