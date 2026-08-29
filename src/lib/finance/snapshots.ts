import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { InsightPeriodType } from "./periods";
import { getPeriodBounds, parsePeriodKey, shiftPeriod } from "./periods";
import { getSpendingMetrics, getPeriodOverPeriodChange, getDailySpendSeries } from "./metrics";
import {
  getCategorySpend,
  getTopMerchants,
  getAccountSpending,
  getCreditCardSummary,
} from "./aggregations";
import type { BudgetProgress } from "./budgets";
import { getBudgetProgress, getBudgetSummary } from "./budgets";
import { getRecurringTransactions } from "@/actions/recurring";
import { addDays } from "date-fns";

const EXCLUDED_KINDS = ["TRANSFER", "CC_PAYMENT", "EXCLUDED"] as const;

export interface SnapshotTransaction {
  id: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryName: string;
  categoryIcon: string | null;
  merchantName: string | null;
  transactionDate: string;
  paymentMethod: string | null;
}

export interface PeriodSnapshot {
  period: InsightPeriodType;
  periodKey: string;
  periodLabel: string;
  dateFrom: string;
  dateTo: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number;
  transactionCount: number;
  topCategory: { id: string; name: string; icon: string | null; amount: number; share: number } | null;
  topMerchant: { name: string; amount: number; txCount: number } | null;
  largestTransaction: SnapshotTransaction | null;
  vsPreviousPeriod: { expenseChange: number; incomeChange: number; expenseDiff: number } | null;
  vsDailyAverage: { avgDailySpend: number; pctDiff: number } | null;
  budgets: ReturnType<typeof getBudgetSummary>;
  budgetItems: BudgetProgress[];
  creditCard: Awaited<ReturnType<typeof getCreditCardSummary>>;
  recurringTotal: number;
  recurringItems: Array<{ name: string; amount: number; frequency: string }>;
  categories: Awaited<ReturnType<typeof getCategorySpend>>;
  merchants: Awaited<ReturnType<typeof getTopMerchants>>;
  accounts: Awaited<ReturnType<typeof getAccountSpending>>;
  dailyTrend: Array<{ date: string; label: string; expenses: number; income: number }>;
  highestSpendDay: { date: string; amount: number } | null;
  lowestSpendDay: { date: string; amount: number } | null;
  unusualTransactions: SnapshotTransaction[];
  transactions: SnapshotTransaction[];
  monthlyTrend: Array<{ month: string; income: number; expenses: number; netSavings: number }>;
  prevMonthMetrics: { income: number; expenses: number; savingsRate: number } | null;
  hasEnoughData: boolean;
}

function serializeTx(t: {
  id: string;
  description: string;
  amount: { toNumber(): number };
  type: "INCOME" | "EXPENSE";
  category: { name: string; icon: string | null };
  merchantName: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
}): SnapshotTransaction {
  return {
    id: t.id,
    description: t.description,
    amount: t.amount.toNumber(),
    type: t.type,
    categoryName: t.category.name,
    categoryIcon: t.category.icon,
    merchantName: t.merchantName,
    transactionDate: t.transactionDate.toISOString(),
    paymentMethod: t.paymentMethod,
  };
}

async function fetchTransactions(userId: string, start: Date, end: Date) {
  return prisma.transaction.findMany({
    where: {
      userId,
      transactionDate: { gte: start, lte: end },
      excludeFromTotals: false,
      transactionKind: { notIn: [...EXCLUDED_KINDS] },
    },
    select: {
      id: true,
      description: true,
      amount: true,
      type: true,
      merchantName: true,
      transactionDate: true,
      paymentMethod: true,
      category: { select: { name: true, icon: true } },
    },
    orderBy: { transactionDate: "desc" },
  });
}

async function detectUnusual(
  userId: string,
  periodTxs: SnapshotTransaction[],
  lookbackDays = 90
): Promise<SnapshotTransaction[]> {
  if (periodTxs.length === 0) return [];

  const since = new Date();
  since.setDate(since.getDate() - lookbackDays);

  const historical = await prisma.transaction.findMany({
    where: {
      userId,
      type: "EXPENSE",
      transactionDate: { gte: since },
      excludeFromTotals: false,
      transactionKind: { notIn: [...EXCLUDED_KINDS] },
    },
    select: { amount: true },
  });

  if (historical.length < 5) return [];

  const amounts = historical.map((t) => t.amount.toNumber());
  const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const variance = amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const threshold = mean + Math.max(stdDev * 2, mean * 0.5);

  return periodTxs.filter((t) => t.type === "EXPENSE" && t.amount >= threshold).slice(0, 5);
}

function getPreviousBounds(period: InsightPeriodType, periodKey: string) {
  const prevKey = shiftPeriod(period, periodKey, -1);
  const ref = parsePeriodKey(period, prevKey);
  return getPeriodBounds(period, ref);
}

export async function buildPeriodSnapshot(
  userId: string,
  period: InsightPeriodType,
  periodKey: string,
  timezone = "Asia/Kolkata"
): Promise<PeriodSnapshot> {
  const ref = parsePeriodKey(period, periodKey);
  const { start, end } = getPeriodBounds(period, ref, timezone);
  const prevBounds = getPreviousBounds(period, periodKey);

  const [
    metrics,
    popChange,
    categories,
    merchants,
    accounts,
    ccSummary,
    budgetItems,
    rawTxs,
    recurringList,
  ] = await Promise.all([
    getSpendingMetrics(userId, { dateFrom: start, dateTo: end }),
    getPeriodOverPeriodChange(userId, start, end, prevBounds.start, prevBounds.end),
    getCategorySpend(userId, start, end),
    getTopMerchants(userId, 10, start, end),
    getAccountSpending(userId, start, end),
    getCreditCardSummary(userId, start, end),
    getBudgetProgress(userId, start, end),
    fetchTransactions(userId, start, end),
    getRecurringTransactions(userId),
  ]);

  const transactions = rawTxs.map(serializeTx);
  const expenseTxs = transactions.filter((t) => t.type === "EXPENSE");
  const totalExpense = metrics.expensesThisMonth;
  const totalIncome = metrics.incomeThisMonth;

  const topCategory = categories[0]
    ? {
        ...categories[0],
        share: totalExpense > 0 ? Math.round((categories[0].amount / totalExpense) * 100) : 0,
      }
    : null;

  const topMerchant = merchants[0]
    ? { name: merchants[0].name, amount: merchants[0].totalAmount, txCount: merchants[0].txCount }
    : null;

  const largestExpense = expenseTxs.reduce<SnapshotTransaction | null>(
    (max, t) => (!max || t.amount > max.amount ? t : max),
    null
  );

  const expenseDiff = popChange.curr.expensesThisMonth - popChange.prev.expensesThisMonth;

  let vsDailyAverage: PeriodSnapshot["vsDailyAverage"] = null;
  if (period === "daily") {
    const series = await getDailySpendSeries(userId, 90);
    const avg =
      series.length > 0
        ? series.reduce((s, d) => s + d.expenses, 0) / series.length
        : 0;
    if (avg > 0) {
      vsDailyAverage = {
        avgDailySpend: Math.round(avg),
        pctDiff: Math.round(((totalExpense - avg) / avg) * 100),
      };
    }
  }

  const dailyTrend: PeriodSnapshot["dailyTrend"] = [];
  let highestSpendDay: PeriodSnapshot["highestSpendDay"] = null;
  let lowestSpendDay: PeriodSnapshot["lowestSpendDay"] = null;

  if (period === "weekly") {
    for (let i = 0; i < 7; i++) {
      const dayStart = addDays(start, i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const dayTxs = await prisma.transaction.findMany({
        where: {
          userId,
          type: "EXPENSE",
          transactionDate: { gte: dayStart, lte: dayEnd },
          excludeFromTotals: false,
          transactionKind: { notIn: [...EXCLUDED_KINDS] },
        },
        select: { amount: true, type: true },
      });
      const expenses = dayTxs.reduce((s, t) => s + t.amount.toNumber(), 0);
      const dateStr = dayStart.toISOString().slice(0, 10);
      dailyTrend.push({
        date: dateStr,
        label: dayStart.toLocaleDateString("en-IN", { weekday: "short" }),
        expenses,
        income: 0,
      });
      if (!highestSpendDay || expenses > highestSpendDay.amount) {
        highestSpendDay = { date: dateStr, amount: expenses };
      }
      if (expenses > 0 && (!lowestSpendDay || expenses < lowestSpendDay.amount)) {
        lowestSpendDay = { date: dateStr, amount: expenses };
      }
    }
  }

  const recurringInPeriod = recurringList.filter((r) => {
    if (!r.nextDueDate) return false;
    const due = new Date(r.nextDueDate);
    return due >= start && due <= end;
  });

  const toMonthly = (amount: number, freq: string) => {
    switch (freq) {
      case "WEEKLY": return amount * 52 / 12;
      case "BIWEEKLY": return amount * 26 / 12;
      case "QUARTERLY": return amount / 3;
      case "YEARLY": return amount / 12;
      default: return amount;
    }
  };

  const recurringTotal = recurringList
    .filter((r) => r.type === "EXPENSE")
    .reduce((s, r) => s + toMonthly(Number(r.amount), r.frequency), 0);

  const unusualTransactions = await detectUnusual(userId, transactions);

  let monthlyTrend: PeriodSnapshot["monthlyTrend"] = [];
  let prevMonthMetrics: PeriodSnapshot["prevMonthMetrics"] = null;

  if (period === "monthly") {
    const { getMonthlyTrend } = await import("./metrics");
    monthlyTrend = await getMonthlyTrend(userId, 6);
    prevMonthMetrics = {
      income: popChange.prev.incomeThisMonth,
      expenses: popChange.prev.expensesThisMonth,
      savingsRate: popChange.prev.savingsRate,
    };
  }

  const budgets = getBudgetSummary(budgetItems);
  const periodLabel = (await import("./periods")).formatPeriodLabel(period, periodKey);

  return {
    period,
    periodKey,
    periodLabel,
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
    income: totalIncome,
    expenses: totalExpense,
    netCashFlow: totalIncome - totalExpense,
    savingsRate: metrics.savingsRate,
    transactionCount: transactions.length,
    topCategory,
    topMerchant,
    largestTransaction: largestExpense,
    vsPreviousPeriod: {
      expenseChange: popChange.expenseChange,
      incomeChange: popChange.incomeChange,
      expenseDiff,
    },
    vsDailyAverage,
    budgets,
    budgetItems,
    creditCard: ccSummary,
    recurringTotal: Math.round(recurringTotal),
    recurringItems: recurringInPeriod.map((r) => ({
      name: r.name,
      amount: Number(r.amount),
      frequency: r.frequency,
    })),
    categories,
    merchants,
    accounts,
    dailyTrend,
    highestSpendDay,
    lowestSpendDay,
    unusualTransactions,
    transactions: transactions.slice(0, period === "daily" ? 50 : 20),
    monthlyTrend,
    prevMonthMetrics,
    hasEnoughData: transactions.length > 0 || totalIncome > 0,
  };
}
