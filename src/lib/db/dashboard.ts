import "server-only";
import { prisma } from "@/lib/db/prisma";
import { startOfMonth, endOfMonth, startOfPrevMonth, endOfPrevMonth } from "@/lib/utils";

export async function getDashboardSummary(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [monthTransactions, allTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, transactionDate: { gte: monthStart, lte: monthEnd } },
      select: { type: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true },
    }),
  ]);

  const incomeThisMonth = monthTransactions
    .filter((t: { type: string; }) => t.type === "INCOME")
    .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);

  const expensesThisMonth = monthTransactions
    .filter((t: { type: string; }) => t.type === "EXPENSE")
    .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);

  const totalIncome = allTransactions
    .filter((t: { type: string; }) => t.type === "INCOME")
    .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);

  const totalExpenses = allTransactions
    .filter((t: { type: string; }) => t.type === "EXPENSE")
    .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);

  return {
    totalBalance: totalIncome - totalExpenses,
    incomeThisMonth,
    expensesThisMonth,
    savingsThisMonth: incomeThisMonth - expensesThisMonth,
  };
}

export async function getMonthlyTrend(userId: string, months = 6) {
  const now = new Date();
  const result: Array<{ month: string; income: number; expenses: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const transactions = await prisma.transaction.findMany({
      where: { userId, transactionDate: { gte: start, lte: end } },
      select: { type: true, amount: true },
    });

    const income = transactions
      .filter((t: { type: string; }) => t.type === "INCOME")
      .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);

    const expenses = transactions
      .filter((t: { type: string; }) => t.type === "EXPENSE")
      .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);

    result.push({
      month: new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date),
      income,
      expenses,
    });
  }

  return result;
}

export async function getCategorySpend(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: monthStart, lte: monthEnd },
    },
    select: { amount: true, category: { select: { name: true, icon: true } } },
  });

  const byCategory = new Map<string, { name: string; icon: string | null; amount: number }>();

  for (const t of transactions) {
    const key = t.category.name;
    const existing = byCategory.get(key);
    if (existing) {
      existing.amount += t.amount.toNumber();
    } else {
      byCategory.set(key, {
        name: t.category.name,
        icon: t.category.icon,
        amount: t.amount.toNumber(),
      });
    }
  }

  return Array.from(byCategory.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);
}

export async function getInsight(userId: string) {
  const now = new Date();
  const currStart = startOfMonth(now);
  const currEnd = endOfMonth(now);
  const prevStart = startOfPrevMonth(now);
  const prevEnd = endOfPrevMonth(now);

  const [currTransactions, prevTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", transactionDate: { gte: currStart, lte: currEnd } },
      select: { amount: true, category: { select: { name: true } } },
    }),
    prisma.transaction.findMany({
      where: { userId, type: "EXPENSE", transactionDate: { gte: prevStart, lte: prevEnd } },
      select: { amount: true, category: { select: { name: true } } },
    }),
  ]);

  if (prevTransactions.length === 0) return null;

  // Aggregate by category
  const curr = new Map<string, number>();
  const prev = new Map<string, number>();

  for (const t of currTransactions) {
    curr.set(t.category.name, (curr.get(t.category.name) || 0) + t.amount.toNumber());
  }
  for (const t of prevTransactions) {
    prev.set(t.category.name, (prev.get(t.category.name) || 0) + t.amount.toNumber());
  }

  let biggestChange: { category: string; pct: number } | null = null;

  for (const [cat, currAmt] of curr.entries()) {
    const prevAmt = prev.get(cat);
    if (!prevAmt || prevAmt === 0) continue;
    const pct = ((currAmt - prevAmt) / prevAmt) * 100;
    if (!biggestChange || Math.abs(pct) > Math.abs(biggestChange.pct)) {
      biggestChange = { category: cat, pct };
    }
  }

  if (!biggestChange) return null;

  const direction = biggestChange.pct > 0 ? "more" : "less";
  const pctStr = Math.abs(Math.round(biggestChange.pct));

  return `You spent ${pctStr}% ${direction} on ${biggestChange.category} this month compared to last month.`;
}

// ---------------------------------------------------------------------------
// Net worth trend: cumulative (income - expenses) per month
// ---------------------------------------------------------------------------
export async function getNetWorthTrend(
  userId: string,
  months = 6
): Promise<Array<{ month: string; netSavings: number; cumulative: number }>> {
  const now = new Date();
  const result: Array<{ month: string; netSavings: number; cumulative: number }> = [];
  let cumulative = 0;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const transactions = await prisma.transaction.findMany({
      where: { userId, transactionDate: { gte: start, lte: end } },
      select: { type: true, amount: true },
    });

    const income = transactions
      .filter((t: { type: string; }) => t.type === "INCOME")
      .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);
    const expenses = transactions
      .filter((t: { type: string; }) => t.type === "EXPENSE")
      .reduce((sum: any, t: { amount: { toNumber: () => any; }; }) => sum + t.amount.toNumber(), 0);

    const netSavings = income - expenses;
    cumulative += netSavings;

    result.push({
      month: new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date),
      netSavings: Math.round(netSavings * 100) / 100,
      cumulative: Math.round(cumulative * 100) / 100,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Daily spend heatmap: avg expense per day-of-week over last 90 days
// ---------------------------------------------------------------------------
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getDailySpendHeatmap(
  userId: string
): Promise<Array<{ day: string; avgSpend: number; totalSpend: number; txCount: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const transactions = await prisma.transaction.findMany({
    where: { userId, type: "EXPENSE", transactionDate: { gte: since } },
    select: { amount: true, transactionDate: true },
  });

  // Map from dayIndex -> { total, count }
  const byDay = new Map<number, { total: number; count: number }>();
  for (let i = 0; i < 7; i++) byDay.set(i, { total: 0, count: 0 });

  // Count how many of each weekday are in the 90-day window (for avg)
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

  // Return Mon–Sun order (1..6, 0)
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

// ---------------------------------------------------------------------------
// Top merchants by total spend this month
// ---------------------------------------------------------------------------
export async function getTopMerchants(
  userId: string,
  limit = 5
): Promise<Array<{ name: string; totalAmount: number; txCount: number }>> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: monthStart, lte: monthEnd },
    },
    select: { description: true, amount: true },
  });

  const byMerchant = new Map<string, { totalAmount: number; txCount: number }>();

  for (const t of transactions) {
    // Use first 3 words as merchant key
    const key = t.description.trim().split(/\s+/).slice(0, 3).join(" ").toUpperCase();
    const existing = byMerchant.get(key);
    if (existing) {
      existing.totalAmount += t.amount.toNumber();
      existing.txCount++;
    } else {
      byMerchant.set(key, { totalAmount: t.amount.toNumber(), txCount: 1 });
    }
  }

  return Array.from(byMerchant.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit)
    .map((m) => ({ ...m, totalAmount: Math.round(m.totalAmount * 100) / 100 }));
}
