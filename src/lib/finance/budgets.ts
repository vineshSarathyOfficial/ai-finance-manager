import "server-only";
import { prisma } from "@/lib/db/prisma";
import { getCategorySpend } from "@/lib/finance/aggregations";
import { startOfMonth, endOfMonth } from "@/lib/utils";

export interface BudgetProgress {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  monthlyLimit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}

export async function getBudgetProgress(
  userId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<BudgetProgress[]> {
  const now = new Date();
  const start = dateFrom ?? startOfMonth(now);
  const end = dateTo ?? endOfMonth(now);

  const [budgets, categorySpend] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    }),
    getCategorySpend(userId, start, end),
  ]);

  const spendMap = new Map(categorySpend.map((c) => [c.id, c.amount]));

  return budgets.map((b) => {
    const spent = spendMap.get(b.categoryId) || 0;
    const limit = b.monthlyLimit.toNumber();
    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryIcon: b.category.icon,
      monthlyLimit: limit,
      spent,
      remaining: limit - spent,
      percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
      isOverBudget: spent > limit,
    };
  });
}

export function getBudgetSummary(budgets: BudgetProgress[]) {
  const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter((b) => b.isOverBudget);
  const underBudget = budgets.filter((b) => !b.isOverBudget && b.percentUsed < 80);
  return { totalLimit, totalSpent, overBudget, underBudget, count: budgets.length };
}
