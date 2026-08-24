import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function getCategoriesByType(userId: string, type: "INCOME" | "EXPENSE") {
  return prisma.category.findMany({
    where: { userId, type },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  userId: string,
  data: { name: string; type: "INCOME" | "EXPENSE"; icon?: string }
) {
  return prisma.category.create({
    data: {
      userId,
      name: data.name.trim(),
      type: data.type,
      icon: data.icon || null,
    },
  });
}

export async function updateCategory(
  id: string,
  userId: string,
  data: { name: string; icon?: string }
) {
  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.category.update({
    where: { id },
    data: { name: data.name.trim(), icon: data.icon || null },
  });
}

export async function deleteCategory(id: string, userId: string) {
  const existing = await prisma.category.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.category.delete({ where: { id } });
}
