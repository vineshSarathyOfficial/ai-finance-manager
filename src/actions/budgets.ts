"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createBudgetSchema } from "@/lib/validations/transaction";
import { getCategorySpend } from "@/lib/finance/aggregations";
import { startOfMonth, endOfMonth } from "@/lib/utils";

export async function getBudgetsAction() {
  const userId = await getRequiredUserId();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [budgets, categorySpend] = await Promise.all([
    prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    }),
    getCategorySpend(userId, monthStart, monthEnd),
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

export async function createBudgetAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = createBudgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    monthlyLimit: formData.get("monthlyLimit"),
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid budget data." };
  }

  await prisma.budget.upsert({
    where: {
      userId_categoryId: { userId, categoryId: parsed.data.categoryId },
    },
    create: {
      userId,
      categoryId: parsed.data.categoryId,
      monthlyLimit: parseFloat(parsed.data.monthlyLimit),
    },
    update: {
      monthlyLimit: parseFloat(parsed.data.monthlyLimit),
    },
  });

  revalidatePath("/budgets");
  return { success: true, message: "Budget saved." };
}

export async function deleteBudgetAction(id: string) {
  const userId = await getRequiredUserId();
  await prisma.budget.deleteMany({ where: { id, userId } });
  revalidatePath("/budgets");
  return { success: true, message: "Budget removed." };
}
