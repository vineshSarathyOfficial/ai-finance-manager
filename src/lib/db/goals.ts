import "server-only";
import { prisma } from "@/lib/db/prisma";

function serializeGoal<T extends { targetAmount: { toNumber(): number }; currentAmount: { toNumber(): number } }>(
  goal: T
) {
  return {
    ...goal,
    targetAmount: goal.targetAmount.toNumber(),
    currentAmount: goal.currentAmount.toNumber(),
  };
}

export async function getSavingsGoals(userId: string) {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  return goals.map(serializeGoal);
}

export async function createSavingsGoal(
  userId: string,
  data: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string; icon?: string }
) {
  const goal = await prisma.savingsGoal.create({
    data: {
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      icon: data.icon || null,
    },
  });
  return serializeGoal(goal);
}

export async function updateSavingsGoal(
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string | null;
    icon: string | null;
  }>
) {
  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.targetAmount !== undefined ? { targetAmount: data.targetAmount } : {}),
      ...(data.currentAmount !== undefined ? { currentAmount: data.currentAmount } : {}),
      ...(data.targetDate !== undefined
        ? { targetDate: data.targetDate ? new Date(data.targetDate) : null }
        : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
    },
  });
  return serializeGoal(goal);
}

export async function deleteSavingsGoal(id: string, userId: string) {
  const existing = await prisma.savingsGoal.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.savingsGoal.delete({ where: { id } });
}
