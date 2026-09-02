import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { AccountType } from "@prisma/client";

export async function getAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
}

export async function getAccountById(id: string, userId: string) {
  return prisma.account.findFirst({ where: { id, userId } });
}

export async function getOrCreateDefaultAccount(userId: string) {
  const existing = await prisma.account.findFirst({
    where: { userId, isDefault: true },
  });
  if (existing) return existing;

  return prisma.account.create({
    data: {
      userId,
      name: "Cash & Bank",
      type: "BANK",
      isDefault: true,
    },
  });
}

export async function createAccount(
  userId: string,
  data: { name: string; type: AccountType; institution?: string; lastFour?: string }
) {
  const count = await prisma.account.count({ where: { userId } });
  return prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      institution: data.institution,
      lastFour: data.lastFour,
      isDefault: count === 0,
    },
  });
}

export async function updateAccount(
  id: string,
  userId: string,
  data: Partial<{ name: string; type: AccountType; institution: string; lastFour: string }>
) {
  return prisma.account.updateMany({
    where: { id, userId },
    data,
  });
}

export async function deleteAccount(id: string, userId: string) {
  const account = await prisma.account.findFirst({ where: { id, userId } });
  if (!account) return { error: "Account not found" };
  if (account.isDefault) return { error: "Cannot delete default account" };

  await prisma.transaction.updateMany({
    where: { accountId: id },
    data: { accountId: null },
  });
  await prisma.account.delete({ where: { id } });
  return { success: true };
}

export async function getAccountBalances(userId: string) {
  const accounts = await getAccounts(userId);
  const result = [];

  for (const account of accounts) {
    const txs = await prisma.transaction.findMany({
      where: { userId, accountId: account.id, excludeFromTotals: false },
      select: { type: true, amount: true },
    });

    const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount.toNumber(), 0);
    const expenses = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount.toNumber(), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthTxs = await prisma.transaction.findMany({
      where: {
        userId,
        accountId: account.id,
        transactionDate: { gte: monthStart, lte: monthEnd },
        excludeFromTotals: false,
        transactionKind: { notIn: ["TRANSFER", "CC_PAYMENT", "EXCLUDED"] },
      },
      select: { type: true, amount: true },
    });

    const monthIncome = monthTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount.toNumber(), 0);
    const monthExpenses = monthTxs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount.toNumber(), 0);

    result.push({
      ...account,
      balance: income - expenses,
      monthIncome,
      monthExpenses,
      transactionCount: txs.length,
    });
  }

  return result;
}

export async function findOrCreateCreditCardAccount(
  userId: string,
  options?: { name?: string; institution?: string }
) {
  if (options?.name) {
    const byName = await prisma.account.findFirst({
      where: {
        userId,
        type: "CREDIT_CARD",
        name: options.name,
      },
    });
    if (byName) return byName;

    return prisma.account.create({
      data: {
        userId,
        name: options.name,
        type: "CREDIT_CARD",
        institution: options.institution,
      },
    });
  }

  const existing = await prisma.account.findFirst({
    where: { userId, type: "CREDIT_CARD" },
  });
  if (existing) return existing;

  return prisma.account.create({
    data: {
      userId,
      name: "Credit Card",
      type: "CREDIT_CARD",
    },
  });
}
