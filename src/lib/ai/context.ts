import { prisma } from "@/lib/db/prisma";
import { getDashboardSummary, getCategorySpend, getMonthlyTrend } from "@/lib/db/dashboard";
import { getRecurringTransactions } from "@/actions/recurring";

export async function buildFinancialContext(userId: string): Promise<string> {
  const [summary, trend, categorySpend, recurringList, recentTxns] = await Promise.all([
    getDashboardSummary(userId),
    getMonthlyTrend(userId, 6),
    getCategorySpend(userId),
    getRecurringTransactions(userId),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: "desc" },
      take: 30,
      select: {
        amount: true,
        type: true,
        description: true,
        transactionDate: true,
        paymentMethod: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  const savingsRate =
    summary.incomeThisMonth > 0
      ? Math.round((summary.savingsThisMonth / summary.incomeThisMonth) * 100)
      : 0;

  const contextObj = {
    currency: "INR (₹)",
    currentMonthSummary: {
      netCashFlow: summary.netCashFlow,
      incomeThisMonth: summary.incomeThisMonth,
      expensesThisMonth: summary.expensesThisMonth,
      savingsThisMonth: summary.savingsThisMonth,
      savingsRatePercent: `${savingsRate}%`,
    },
    topCategoriesThisMonth: categorySpend.slice(0, 6).map((c) => ({
      category: c.name,
      amount: c.amount,
    })),
    sixMonthTrend: trend.map((t) => ({
      month: t.month,
      income: t.income,
      expenses: t.expenses,
      net: t.income - t.expenses,
    })),
    activeRecurringSubscriptions: recurringList
      .filter((r) => r.isActive)
      .map((r) => ({
        name: r.name,
        amount: r.amount,
        frequency: r.frequency,
        category: r.category?.name ?? "Uncategorized",
      })),
    recentTransactions: recentTxns.map((t) => ({
      date: new Date(t.transactionDate).toISOString().split("T")[0],
      type: t.type,
      amount: t.amount.toNumber(),
      merchant: t.description,
      category: t.category.name,
      paymentMethod: t.paymentMethod ?? "Unknown",
    })),
  };

  return JSON.stringify(contextObj, null, 2);
}
