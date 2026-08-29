import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function getTransactionSplits(transactionId: string, userId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true },
  });
  if (!tx) return [];

  const splits = await prisma.transactionSplit.findMany({
    where: { transactionId },
    include: { category: { select: { id: true, name: true, icon: true } } },
    orderBy: { amount: "desc" },
  });

  return splits.map((s) => ({
    id: s.id,
    categoryId: s.categoryId,
    categoryName: s.category.name,
    categoryIcon: s.category.icon,
    amount: s.amount.toNumber(),
  }));
}

export async function saveTransactionSplits(
  transactionId: string,
  userId: string,
  splits: { categoryId: string; amount: number }[]
) {
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    select: { id: true, amount: true },
  });
  if (!tx) return { error: "Transaction not found." };

  if (splits.length === 0) {
    await prisma.transactionSplit.deleteMany({ where: { transactionId } });
    return { success: true };
  }

  const total = splits.reduce((sum, s) => sum + s.amount, 0);
  const txAmount = tx.amount.toNumber();
  if (Math.abs(total - txAmount) > 0.01) {
    return { error: `Split amounts must equal transaction total (₹${txAmount.toFixed(2)}).` };
  }

  await prisma.$transaction([
    prisma.transactionSplit.deleteMany({ where: { transactionId } }),
    prisma.transactionSplit.createMany({
      data: splits.map((s) => ({
        transactionId,
        categoryId: s.categoryId,
        amount: s.amount,
      })),
    }),
  ]);

  return { success: true };
}
