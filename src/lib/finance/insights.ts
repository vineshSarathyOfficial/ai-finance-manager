import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getSpendingMetrics, getMonthOverMonthChange } from "./metrics";
import { getCategorySpend, getTopMerchants } from "./aggregations";
import { startOfMonth, endOfMonth } from "@/lib/utils";

export interface Insight {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  severity: "info" | "warning" | "positive";
  value?: number;
}

export async function generateInsights(userId: string, limit = 10): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [mom, categories, merchants, metrics, uncategorized] = await Promise.all([
    getMonthOverMonthChange(userId),
    getCategorySpend(userId),
    getTopMerchants(userId, 5),
    getSpendingMetrics(userId),
    prisma.transaction.count({
      where: {
        userId,
        transactionDate: { gte: monthStart, lte: monthEnd },
        category: { name: "Other" },
        type: "EXPENSE",
      },
    }),
  ]);

  const dateFrom = monthStart.toISOString().slice(0, 10);
  const dateTo = monthEnd.toISOString().slice(0, 10);

  if (Math.abs(mom.expenseChange) >= 15) {
    insights.push({
      id: "spending-mom",
      type: "spending_change",
      title: mom.expenseChange > 0 ? "Spending increased" : "Spending decreased",
      message: `Your expenses are ${Math.abs(mom.expenseChange)}% ${mom.expenseChange > 0 ? "higher" : "lower"} than last month.`,
      href: `/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}&type=EXPENSE`,
      severity: mom.expenseChange > 0 ? "warning" : "positive",
      value: mom.expenseChange,
    });
  }

  const totalSpend = categories.reduce((s, c) => s + c.amount, 0);
  for (const cat of categories) {
    const share = totalSpend > 0 ? (cat.amount / totalSpend) * 100 : 0;
    if (share >= 30) {
      insights.push({
        id: `category-${cat.id}`,
        type: "category_concentration",
        title: `${cat.name} dominates spending`,
        message: `${cat.name} accounts for ${Math.round(share)}% of your spending this month (${formatINR(cat.amount)}).`,
        href: `/transactions?categoryId=${cat.id}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
        severity: "warning",
        value: Math.round(share),
      });
    }
  }

  for (const merchant of merchants) {
    const share = totalSpend > 0 ? (merchant.totalAmount / totalSpend) * 100 : 0;
    if (share >= 15) {
      insights.push({
        id: `merchant-${merchant.name}`,
        type: "merchant_dominance",
        title: `High spend at ${merchant.name}`,
        message: `${merchant.name} accounts for ${Math.round(share)}% of spending (${formatINR(merchant.totalAmount)} across ${merchant.txCount} transactions).`,
        href: `/transactions?search=${encodeURIComponent(merchant.name)}&dateFrom=${dateFrom}&dateTo=${dateTo}`,
        severity: "info",
        value: Math.round(share),
      });
    }
  }

  if (uncategorized >= 10) {
    insights.push({
      id: "uncategorized",
      type: "uncategorized",
      title: "Uncategorized transactions",
      message: `You have ${uncategorized} transactions categorized as "Other" this month. Review them for better insights.`,
      href: `/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      severity: "info",
      value: uncategorized,
    });
  }

  if (metrics.savingsRate < 10 && metrics.incomeThisMonth > 0) {
    insights.push({
      id: "low-savings",
      type: "low_savings",
      title: "Low savings rate",
      message: `You're saving only ${metrics.savingsRate}% of income this month. Consider reviewing discretionary spending.`,
      href: `/analytics?tab=categories`,
      severity: "warning",
      value: metrics.savingsRate,
    });
  } else if (metrics.savingsRate >= 30) {
    insights.push({
      id: "good-savings",
      type: "good_savings",
      title: "Strong savings rate",
      message: `Great job! You're saving ${metrics.savingsRate}% of your income this month.`,
      href: `/analytics`,
      severity: "positive",
      value: metrics.savingsRate,
    });
  }

  const ccSummary = await import("./aggregations").then((a) => a.getCreditCardSummary(userId));
  if (ccSummary && ccSummary.totalSpend > 0) {
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const prevTxs = await prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        transactionDate: { gte: prevStart, lt: monthStart },
        OR: [
          { account: { type: "CREDIT_CARD" } },
          { paymentMethod: { contains: "Credit Card", mode: "insensitive" } },
        ],
        excludeFromTotals: false,
      },
      select: { amount: true, transactionDate: true },
    });

    const months = 3;
    const avgMonthly = prevTxs.reduce((s, t) => s + t.amount.toNumber(), 0) / months;
    if (avgMonthly > 0 && ccSummary.totalSpend > avgMonthly * 1.5) {
      insights.push({
        id: "cc-spike",
        type: "cc_spike",
        title: "Credit card spending spike",
        message: `Credit card spending (${formatINR(ccSummary.totalSpend)}) is unusually high compared to your 3-month average.`,
        href: `/credit-cards`,
        severity: "warning",
      });
    }
  }

  return insights
    .sort((a, b) => {
      const severityOrder = { warning: 0, info: 1, positive: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, limit);
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export async function getTopInsight(userId: string) {
  const insights = await generateInsights(userId, 1);
  return insights[0] ?? null;
}
