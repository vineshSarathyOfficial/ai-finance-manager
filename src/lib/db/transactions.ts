import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { TransactionFilters } from "@/lib/validations/transaction";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Serialization helper
// Prisma returns `amount` as a Decimal object which Next.js cannot pass to
// Client Components. We convert it to a plain `number` at the query boundary.
// ---------------------------------------------------------------------------
function serializeTx<
  T extends { amount: { toNumber(): number } }
>(tx: T): Omit<T, "amount"> & { amount: number } {
  return { ...tx, amount: tx.amount.toNumber() };
}

export async function getTransactions(userId: string, filters: TransactionFilters) {
  const {
    search,
    type,
    categoryId,
    dateFrom,
    dateTo,
    page,
    pageSize,
    sortBy,
    sortOrder,
  } = filters;

  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(type && type !== "ALL" ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          description: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...(dateFrom || dateTo
      ? {
          transactionDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo + "T23:59:59") } : {}),
          },
        }
      : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: transactions.map(serializeTx),
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function getTransactionById(id: string, userId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });
  return tx ? serializeTx(tx) : null;
}

export async function createTransaction(
  userId: string,
  data: {
    type: "INCOME" | "EXPENSE";
    amount: string;
    description: string;
    categoryId: string;
    transactionDate: string;
    paymentMethod?: string;
    notes?: string;
  }
) {
  const tx = await prisma.transaction.create({
    data: {
      userId,
      type: data.type,
      amount: parseFloat(data.amount),
      description: data.description,
      categoryId: data.categoryId,
      transactionDate: new Date(data.transactionDate),
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
    },
    include: { category: true },
  });
  return serializeTx(tx);
}

export async function updateTransaction(
  id: string,
  userId: string,
  data: {
    type: "INCOME" | "EXPENSE";
    amount: string;
    description: string;
    categoryId: string;
    transactionDate: string;
    paymentMethod?: string;
    notes?: string;
  }
) {
  // Verify ownership before update
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const tx = await prisma.transaction.update({
    where: { id },
    data: {
      type: data.type,
      amount: parseFloat(data.amount),
      description: data.description,
      categoryId: data.categoryId,
      transactionDate: new Date(data.transactionDate),
      paymentMethod: data.paymentMethod || null,
      notes: data.notes || null,
    },
    include: { category: true },
  });
  return serializeTx(tx);
}

export async function deleteTransaction(id: string, userId: string) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return null;

  return prisma.transaction.delete({ where: { id } });
}

export async function getRecentTransactions(userId: string, limit = 8) {
  const txns = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { transactionDate: "desc" },
    take: limit,
  });
  return txns.map(serializeTx);
}
