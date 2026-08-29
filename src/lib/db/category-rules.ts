import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { TransactionType } from "@prisma/client";

export async function getCategoryRules(userId: string) {
  return prisma.categoryRule.findMany({
    where: { userId },
    include: { category: { select: { id: true, name: true, type: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function createCategoryRule(
  userId: string,
  data: { keyword: string; categoryId: string; type: TransactionType }
) {
  const keyword = data.keyword.trim().toLowerCase();
  return prisma.categoryRule.create({
    data: {
      userId,
      keyword,
      categoryId: data.categoryId,
      type: data.type,
    },
    include: { category: { select: { id: true, name: true, type: true } } },
  });
}

export async function deleteCategoryRule(id: string, userId: string) {
  return prisma.categoryRule.deleteMany({ where: { id, userId } });
}

export async function getCategoryRulesForEngine(userId: string) {
  const rules = await prisma.categoryRule.findMany({
    where: { userId },
    include: { category: { select: { name: true } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return rules.map((r) => ({
    keyword: r.keyword,
    categoryName: r.category.name,
    type: r.type as "EXPENSE" | "INCOME",
    confidence: 0.99,
  }));
}
