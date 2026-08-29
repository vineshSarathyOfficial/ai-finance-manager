import "server-only";
import { prisma } from "@/lib/db/prisma";
import { startOfMonth, endOfMonth } from "@/lib/utils";
import type { TransactionKind } from "@prisma/client";

const EXCLUDED_KINDS: TransactionKind[] = ["TRANSFER", "CC_PAYMENT", "EXCLUDED"];

export async function getCategorySpend(
  userId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  const now = new Date();
  const start = dateFrom ?? startOfMonth(now);
  const end = dateTo ?? endOfMonth(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: start, lte: end },
      excludeFromTotals: false,
      transactionKind: { notIn: EXCLUDED_KINDS },
    },
    select: { amount: true, category: { select: { id: true, name: true, icon: true } } },
  });

  const byCategory = new Map<string, { id: string; name: string; icon: string | null; amount: number }>();

  for (const t of transactions) {
    const key = t.category.name;
    const existing = byCategory.get(key);
    if (existing) {
      existing.amount += t.amount.toNumber();
    } else {
      byCategory.set(key, {
        id: t.category.id,
        name: t.category.name,
        icon: t.category.icon,
        amount: t.amount.toNumber(),
      });
    }
  }

  return Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount);
}

export async function getTopMerchants(userId: string, limit = 10, dateFrom?: Date, dateTo?: Date) {
  const now = new Date();
  const start = dateFrom ?? startOfMonth(now);
  const end = dateTo ?? endOfMonth(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: start, lte: end },
      excludeFromTotals: false,
      transactionKind: { notIn: EXCLUDED_KINDS },
    },
    select: { merchantName: true, description: true, amount: true },
  });

  const byMerchant = new Map<string, { name: string; totalAmount: number; txCount: number }>();

  for (const t of transactions) {
    const key = t.merchantName || t.description.trim().split(/\s+/).slice(0, 3).join(" ");
    const existing = byMerchant.get(key);
    if (existing) {
      existing.totalAmount += t.amount.toNumber();
      existing.txCount++;
    } else {
      byMerchant.set(key, { name: key, totalAmount: t.amount.toNumber(), txCount: 1 });
    }
  }

  return Array.from(byMerchant.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit)
    .map((m) => ({ ...m, totalAmount: Math.round(m.totalAmount * 100) / 100 }));
}

export async function getCategoryMonthOverMonth(userId: string) {
  const now = new Date();
  const currStart = startOfMonth(now);
  const currEnd = endOfMonth(now);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [currTxs, prevTxs] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId, type: "EXPENSE",
        transactionDate: { gte: currStart, lte: currEnd },
        excludeFromTotals: false,
        transactionKind: { notIn: EXCLUDED_KINDS },
      },
      select: { amount: true, category: { select: { id: true, name: true } } },
    }),
    prisma.transaction.findMany({
      where: {
        userId, type: "EXPENSE",
        transactionDate: { gte: prevStart, lte: prevEnd },
        excludeFromTotals: false,
        transactionKind: { notIn: EXCLUDED_KINDS },
      },
      select: { amount: true, category: { select: { id: true, name: true } } },
    }),
  ]);

  const curr = new Map<string, { id: string; amount: number }>();
  const prev = new Map<string, number>();

  for (const t of currTxs) {
    const e = curr.get(t.category.name);
    if (e) e.amount += t.amount.toNumber();
    else curr.set(t.category.name, { id: t.category.id, amount: t.amount.toNumber() });
  }
  for (const t of prevTxs) {
    prev.set(t.category.name, (prev.get(t.category.name) || 0) + t.amount.toNumber());
  }

  const totalCurr = Array.from(curr.values()).reduce((s, c) => s + c.amount, 0);

  return Array.from(curr.entries())
    .map(([name, { id, amount }]) => {
      const prevAmt = prev.get(name) || 0;
      const pctChange = prevAmt > 0 ? Math.round(((amount - prevAmt) / prevAmt) * 100) : 0;
      const share = totalCurr > 0 ? Math.round((amount / totalCurr) * 100) : 0;
      return { id, name, amount, prevAmount: prevAmt, pctChange, share };
    })
    .sort((a, b) => b.amount - a.amount);
}

export async function getAccountSpending(userId: string, dateFrom?: Date, dateTo?: Date) {
  const now = new Date();
  const start = dateFrom ?? startOfMonth(now);
  const end = dateTo ?? endOfMonth(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: start, lte: end },
      excludeFromTotals: false,
      transactionKind: { notIn: EXCLUDED_KINDS },
      accountId: { not: null },
    },
    select: { amount: true, account: { select: { id: true, name: true, type: true } } },
  });

  const byAccount = new Map<string, { id: string; name: string; type: string; amount: number }>();

  for (const t of transactions) {
    if (!t.account) continue;
    const key = t.account.id;
    const existing = byAccount.get(key);
    if (existing) {
      existing.amount += t.amount.toNumber();
    } else {
      byAccount.set(key, {
        id: t.account.id,
        name: t.account.name,
        type: t.account.type,
        amount: t.amount.toNumber(),
      });
    }
  }

  return Array.from(byAccount.values()).sort((a, b) => b.amount - a.amount);
}

export async function getCreditCardSummary(userId: string) {
  const ccAccounts = await prisma.account.findMany({
    where: { userId, type: "CREDIT_CARD" },
  });

  if (ccAccounts.length === 0) {
    const ccTxs = await prisma.transaction.count({
      where: { userId, paymentMethod: { contains: "Credit Card", mode: "insensitive" } },
    });
    if (ccTxs === 0) return null;
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const accountIds = ccAccounts.map((a) => a.id);

  const whereClause = accountIds.length > 0
    ? { userId, accountId: { in: accountIds } }
    : { userId, paymentMethod: { contains: "Credit Card", mode: "insensitive" as const } };

  const monthTxs = await prisma.transaction.findMany({
    where: {
      ...whereClause,
      type: "EXPENSE",
      transactionDate: { gte: monthStart, lte: monthEnd },
      excludeFromTotals: false,
      transactionKind: { notIn: EXCLUDED_KINDS },
    },
    select: { amount: true, accountId: true, account: { select: { name: true } } },
  });

  const totalSpend = monthTxs.reduce((s, t) => s + t.amount.toNumber(), 0);

  const byCard = new Map<string, { name: string; amount: number }>();
  for (const t of monthTxs) {
    const name = t.account?.name ?? "Credit Card";
    const key = t.accountId ?? "default";
    const e = byCard.get(key);
    if (e) e.amount += t.amount.toNumber();
    else byCard.set(key, { name, amount: t.amount.toNumber() });
  }

  return {
    totalSpend,
    cards: Array.from(byCard.entries()).map(([id, data]) => ({ id, ...data })),
    cardCount: Math.max(ccAccounts.length, byCard.size),
  };
}

export async function getDailySpendHeatmap(userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: since },
      excludeFromTotals: false,
      transactionKind: { notIn: EXCLUDED_KINDS },
    },
    select: { amount: true, transactionDate: true },
  });

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDay = new Map<number, { total: number; count: number }>();
  for (let i = 0; i < 7; i++) byDay.set(i, { total: 0, count: 0 });

  const dayCounts = new Array(7).fill(0);
  const now = new Date();
  for (let d = 0; d < 90; d++) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    dayCounts[day.getDay()]++;
  }

  for (const t of transactions) {
    const dow = new Date(t.transactionDate).getDay();
    const entry = byDay.get(dow)!;
    entry.total += t.amount.toNumber();
    entry.count++;
  }

  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dow) => {
    const { total, count } = byDay.get(dow)!;
    return {
      day: DAY_NAMES[dow],
      avgSpend: dayCounts[dow] > 0 ? Math.round((total / dayCounts[dow]) * 100) / 100 : 0,
      totalSpend: Math.round(total * 100) / 100,
      txCount: count,
    };
  });
}

export async function getNetWorthTrend(userId: string, months = 6) {
  const trend = await import("./metrics").then((m) => m.getMonthlyTrend(userId, months));
  let cumulative = 0;
  return trend.map((t) => {
    cumulative += t.netSavings;
    return {
      month: t.month,
      netSavings: t.netSavings,
      cumulative: Math.round(cumulative * 100) / 100,
    };
  });
}
