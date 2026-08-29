import type { Insight } from "./types";
import { formatINR } from "./types";
import type { PeriodSnapshot } from "../snapshots";
import { insightsUrl } from "../periods";

function txUrl(snapshot: PeriodSnapshot, extra = "") {
  const from = snapshot.dateFrom.slice(0, 10);
  const to = snapshot.dateTo.slice(0, 10);
  return `/transactions?dateFrom=${from}&dateTo=${to}${extra}`;
}

export function generatePeriodInsights(snapshot: PeriodSnapshot): Insight[] {
  const insights: Insight[] = [];
  const { period, periodKey } = snapshot;
  const base = { period, periodKey };

  if (snapshot.expenses > 0 && snapshot.vsPreviousPeriod) {
    const { expenseChange, expenseDiff } = snapshot.vsPreviousPeriod;
    const absChange = Math.abs(expenseChange);

    if (period === "daily" && snapshot.vsDailyAverage && Math.abs(snapshot.vsDailyAverage.pctDiff) >= 15) {
      const { pctDiff, avgDailySpend } = snapshot.vsDailyAverage;
      insights.push({
        ...base,
        id: "daily-vs-avg",
        type: "spending_change",
        title: pctDiff > 0 ? "Above your usual spending" : "Below your usual spending",
        message: `You spent ${formatINR(snapshot.expenses)} today, which is ${Math.abs(pctDiff)}% ${pctDiff > 0 ? "higher" : "lower"} than your usual daily spending of ${formatINR(avgDailySpend)}.`,
        href: insightsUrl("daily", periodKey),
        severity: pctDiff > 0 ? "warning" : "positive",
        priority: 10,
        value: pctDiff,
      });
    }

    if (absChange >= 10) {
      const periodLabel = period === "daily" ? "yesterday" : period === "weekly" ? "last week" : "last month";
      insights.push({
        ...base,
        id: "period-spending-change",
        type: "spending_change",
        title: expenseChange > 0 ? "Spending increased" : "Spending decreased",
        message:
          period === "daily"
            ? `You spent ${formatINR(Math.abs(expenseDiff))} ${expenseChange > 0 ? "more" : "less"} than ${periodLabel}.`
            : `You spent ${formatINR(snapshot.expenses)} this ${period === "weekly" ? "week" : "month"}, ${absChange}% ${expenseChange > 0 ? "more" : "less"} than ${periodLabel}.`,
        href: txUrl(snapshot, "&type=EXPENSE"),
        severity: expenseChange > 0 ? "warning" : "positive",
        priority: 9,
        value: expenseChange,
      });
    }
  }

  if (snapshot.largestTransaction && snapshot.largestTransaction.amount > 0) {
    const t = snapshot.largestTransaction;
    insights.push({
      ...base,
      id: "largest-tx",
      type: "largest_transaction",
      title: "Largest transaction",
      message: `Your largest expense was ${formatINR(t.amount)} at ${t.merchantName || t.description}.`,
      href: `/transactions?search=${encodeURIComponent(t.merchantName || t.description)}`,
      severity: "info",
      priority: 7,
      value: t.amount,
    });
  }

  if (snapshot.topCategory && snapshot.topCategory.share >= 25) {
    insights.push({
      ...base,
      id: `category-${snapshot.topCategory.id}`,
      type: "category_concentration",
      title: `${snapshot.topCategory.name} leads spending`,
      message: `${snapshot.topCategory.name} accounted for ${snapshot.topCategory.share}% of your spending (${formatINR(snapshot.topCategory.amount)}).`,
      href: txUrl(snapshot, `&categoryId=${snapshot.topCategory.id}`),
      severity: snapshot.topCategory.share >= 40 ? "warning" : "info",
      priority: 8,
      value: snapshot.topCategory.share,
      category: snapshot.topCategory.name,
    });
  }

  for (const budget of snapshot.budgetItems) {
    if (budget.percentUsed >= 80) {
      const remaining = budget.remaining;
      insights.push({
        ...base,
        id: `budget-${budget.categoryId}`,
        type: "budget_risk",
        title: budget.isOverBudget ? `${budget.categoryName} over budget` : `${budget.categoryName} nearing budget`,
        message: budget.isOverBudget
          ? `${budget.categoryName} exceeded its budget by ${formatINR(Math.abs(remaining))}.`
          : `You're ${formatINR(Math.max(remaining, 0))} away from your ${budget.categoryName} budget (${budget.percentUsed}% used).`,
        href: "/budgets",
        severity: budget.isOverBudget ? "warning" : "info",
        priority: budget.isOverBudget ? 9 : 6,
        value: budget.percentUsed,
        category: budget.categoryName,
      });
    }
  }

  if (snapshot.creditCard && snapshot.creditCard.totalSpend > 0) {
    insights.push({
      ...base,
      id: "cc-spend",
      type: "credit_card",
      title: "Credit card spending",
      message: `You spent ${formatINR(snapshot.creditCard.totalSpend)} on credit cards this ${period === "daily" ? "day" : period === "weekly" ? "week" : "month"}.`,
      href: "/credit-cards",
      severity: "info",
      priority: 5,
      value: snapshot.creditCard.totalSpend,
    });
  }

  if (snapshot.recurringItems.length > 0) {
    const total = snapshot.recurringItems.reduce((s, r) => s + r.amount, 0);
    insights.push({
      ...base,
      id: "recurring-period",
      type: "recurring",
      title: "Recurring charges",
      message: `${snapshot.recurringItems.length} recurring payment${snapshot.recurringItems.length !== 1 ? "s" : ""} (${formatINR(total)}) in this period.`,
      href: "/subscriptions",
      severity: "info",
      priority: 4,
      value: total,
    });
  }

  if (snapshot.unusualTransactions.length > 0) {
    const t = snapshot.unusualTransactions[0];
    insights.push({
      ...base,
      id: "unusual-spend",
      type: "unusual",
      title: "Unusual spending detected",
      message: `${t.merchantName || t.description} (${formatINR(t.amount)}) is higher than your typical transactions.`,
      href: txUrl(snapshot),
      severity: "warning",
      priority: 8,
      value: t.amount,
    });
  }

  if (period === "weekly" && snapshot.highestSpendDay) {
    const dayLabel = new Date(snapshot.highestSpendDay.date).toLocaleDateString("en-IN", { weekday: "long" });
    insights.push({
      ...base,
      id: "highest-day",
      type: "day_pattern",
      title: "Highest spending day",
      message: `${dayLabel} was your highest-spending day this week (${formatINR(snapshot.highestSpendDay.amount)}).`,
      href: txUrl(snapshot),
      severity: "info",
      priority: 6,
    });
  }

  if (period === "monthly") {
    if (snapshot.savingsRate >= 20) {
      insights.push({
        ...base,
        id: "savings-rate",
        type: "savings",
        title: "Strong savings rate",
        message: `Your savings rate is ${snapshot.savingsRate}%${snapshot.prevMonthMetrics ? `, up from ${snapshot.prevMonthMetrics.savingsRate}% last month` : ""}.`,
        href: insightsUrl("monthly", periodKey),
        severity: "positive",
        priority: 7,
        value: snapshot.savingsRate,
      });
    } else if (snapshot.savingsRate < 10 && snapshot.income > 0) {
      insights.push({
        ...base,
        id: "low-savings",
        type: "savings",
        title: "Low savings rate",
        message: `You're saving only ${snapshot.savingsRate}% of income this month.`,
        href: "/analytics",
        severity: "warning",
        priority: 7,
        value: snapshot.savingsRate,
      });
    }

    if (snapshot.budgets.overBudget.length > 0) {
      insights.push({
        ...base,
        id: "budgets-over",
        type: "budget_summary",
        title: "Budgets exceeded",
        message: `${snapshot.budgets.overBudget.length} categor${snapshot.budgets.overBudget.length === 1 ? "y" : "ies"} exceeded their planned budget.`,
        href: "/budgets",
        severity: "warning",
        priority: 8,
        value: snapshot.budgets.overBudget.length,
      });
    }

    const growing = snapshot.categories.slice(0, 3);
    if (growing.length > 0 && snapshot.prevMonthMetrics) {
      const top = growing[0];
      if (top && snapshot.expenses > 0) {
        const share = Math.round((top.amount / snapshot.expenses) * 100);
        if (share >= 20) {
          insights.push({
            ...base,
            id: "top-category-month",
            type: "category_leader",
            title: `${top.name} is your top category`,
            message: `${top.name} was your biggest spending category at ${formatINR(top.amount)} (${share}% of total).`,
            href: txUrl(snapshot, `&categoryId=${top.id}`),
            severity: "info",
            priority: 5,
            category: top.name,
          });
        }
      }
    }
  }

  if (snapshot.transactionCount === 0 && snapshot.income === 0) {
    return [];
  }

  return insights
    .sort((a, b) => b.priority - a.priority || (a.severity === "warning" ? -1 : 1))
    .slice(0, 12);
}

export function buildSummaryText(snapshot: PeriodSnapshot, insights: Insight[]): string {
  if (insights.length > 0) return insights[0].message;

  if (snapshot.expenses > 0) {
    return `You spent ${formatINR(snapshot.expenses)} ${snapshot.period === "daily" ? "today" : snapshot.period === "weekly" ? "this week" : "this month"}.`;
  }
  if (snapshot.income > 0) {
    return `You earned ${formatINR(snapshot.income)} ${snapshot.period === "daily" ? "today" : snapshot.period === "weekly" ? "this week" : "this month"}.`;
  }
  return "No financial activity in this period.";
}
