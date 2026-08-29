import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Prisma, TransactionKind } from "@prisma/client";
import { startOfMonth, endOfMonth } from "@/lib/utils";

export interface MetricsOptions {
  excludeTransfers?: boolean;
  excludeCcPayments?: boolean;
  accountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

function buildWhere(
  userId: string,
  options: MetricsOptions = {}
): Prisma.TransactionWhereInput {
  const kindsToExclude: TransactionKind[] = ["EXCLUDED"];
  if (options.excludeTransfers !== false) kindsToExclude.push("TRANSFER");
  if (options.excludeCcPayments !== false) kindsToExclude.push("CC_PAYMENT");

  return {
    userId,
    excludeFromTotals: false,
    transactionKind: { notIn: kindsToExclude },
    ...(options.accountId ? { accountId: options.accountId } : {}),
    ...(options.dateFrom || options.dateTo
      ? {
          transactionDate: {
            ...(options.dateFrom ? { gte: options.dateFrom } : {}),
            ...(options.dateTo ? { lte: options.dateTo } : {}),
          },
        }
      : {}),
  };
}

function sumByType(
  txs: Array<{ type: string; amount: { toNumber(): number } }>,
  type: "INCOME" | "EXPENSE"
) {
  return txs
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount.toNumber(), 0);
}

export async function getSpendingMetrics(userId: string, options: MetricsOptions = {}) {
  const now = new Date();
  const monthStart = options.dateFrom ?? startOfMonth(now);
  const monthEnd = options.dateTo ?? endOfMonth(now);

  const where = buildWhere(userId, { ...options, dateFrom: monthStart, dateTo: monthEnd });

  const [monthTxs, allTxs] = await Promise.all([
    prisma.transaction.findMany({ where, select: { type: true, amount: true } }),
    prisma.transaction.findMany({
      where: buildWhere(userId, options),
      select: { type: true, amount: true },
    }),
  ]);

  const incomeThisMonth = sumByType(monthTxs, "INCOME");
  const expensesThisMonth = sumByType(monthTxs, "EXPENSE");
  const totalIncome = sumByType(allTxs, "INCOME");
  const totalExpenses = sumByType(allTxs, "EXPENSE");

  return {
    incomeThisMonth,
    expensesThisMonth,
    savingsThisMonth: incomeThisMonth - expensesThisMonth,
    savingsRate: incomeThisMonth > 0 ? Math.round(((incomeThisMonth - expensesThisMonth) / incomeThisMonth) * 100) : 0,
    netCashFlow: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
  };
}

export async function getMonthlyTrend(userId: string, months = 6, options: MetricsOptions = {}) {
  const now = new Date();
  const result: Array<{ month: string; income: number; expenses: number; netSavings: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const txs = await prisma.transaction.findMany({
      where: buildWhere(userId, { ...options, dateFrom: start, dateTo: end }),
      select: { type: true, amount: true },
    });

    const income = sumByType(txs, "INCOME");
    const expenses = sumByType(txs, "EXPENSE");
    result.push({
      month: new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date),
      income,
      expenses,
      netSavings: income - expenses,
    });
  }

  return result;
}

export async function getMonthOverMonthChange(userId: string) {
  const now = new Date();
  const currStart = startOfMonth(now);
  const currEnd = endOfMonth(now);
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [curr, prev] = await Promise.all([
    getSpendingMetrics(userId, { dateFrom: currStart, dateTo: currEnd }),
    getSpendingMetrics(userId, { dateFrom: prevStart, dateTo: prevEnd }),
  ]);

  const expenseChange =
    prev.expensesThisMonth > 0
      ? Math.round(((curr.expensesThisMonth - prev.expensesThisMonth) / prev.expensesThisMonth) * 100)
      : 0;

  const incomeChange =
    prev.incomeThisMonth > 0
      ? Math.round(((curr.incomeThisMonth - prev.incomeThisMonth) / prev.incomeThisMonth) * 100)
      : 0;

  return { expenseChange, incomeChange, curr, prev };
}

export async function getPeriodOverPeriodChange(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
  prevFrom: Date,
  prevTo: Date
) {
  const [curr, prev] = await Promise.all([
    getSpendingMetrics(userId, { dateFrom, dateTo }),
    getSpendingMetrics(userId, { dateFrom: prevFrom, dateTo: prevTo }),
  ]);

  const expenseChange =
    prev.expensesThisMonth > 0
      ? Math.round(((curr.expensesThisMonth - prev.expensesThisMonth) / prev.expensesThisMonth) * 100)
      : curr.expensesThisMonth > 0
      ? 100
      : 0;

  const incomeChange =
    prev.incomeThisMonth > 0
      ? Math.round(((curr.incomeThisMonth - prev.incomeThisMonth) / prev.incomeThisMonth) * 100)
      : curr.incomeThisMonth > 0
      ? 100
      : 0;

  return { expenseChange, incomeChange, curr, prev };
}

export async function getDailySpendSeries(userId: string, days: number) {
  const now = new Date();
  const result: Array<{ date: string; income: number; expenses: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const txs = await prisma.transaction.findMany({
      where: buildWhere(userId, { dateFrom: start, dateTo: end }),
      select: { type: true, amount: true },
    });

    result.push({
      date: start.toISOString().slice(0, 10),
      income: sumByType(txs, "INCOME"),
      expenses: sumByType(txs, "EXPENSE"),
    });
  }

  return result;
}

export async function getWeeklyTrend(userId: string, weeks: number, options: MetricsOptions = {}) {
  const now = new Date();
  const result: Array<{ weekKey: string; label: string; income: number; expenses: number }> = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const ref = new Date(now);
    ref.setDate(ref.getDate() - i * 7);
    const day = ref.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(ref);
    start.setDate(ref.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const txs = await prisma.transaction.findMany({
      where: buildWhere(userId, { ...options, dateFrom: start, dateTo: end }),
      select: { type: true, amount: true },
    });

    const year = start.getFullYear();
    const weekNum = Math.ceil(
      ((start.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7
    );

    result.push({
      weekKey: `${year}-W${String(weekNum).padStart(2, "0")}`,
      label: `${start.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`,
      income: sumByType(txs, "INCOME"),
      expenses: sumByType(txs, "EXPENSE"),
    });
  }

  return result;
}
