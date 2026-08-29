import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { TransactionFilters } from "@/lib/validations/transaction";
import type { Prisma, TransactionKind } from "@prisma/client";
import { classifyTransaction } from "@/lib/finance/classification";
import { getOrCreateDefaultAccount } from "@/lib/db/accounts";

function serializeTx<
  T extends { amount: { toNumber(): number } }
>(tx: T): Omit<T, "amount"> & { amount: number } {
  return { ...tx, amount: tx.amount.toNumber() };
}

function buildWhere(userId: string, filters: TransactionFilters): Prisma.TransactionWhereInput {
  const {
    search, type, categoryId, accountId, merchant, paymentMethod,
    transactionKind, minAmount, maxAmount, excludeTransfers, dateFrom, dateTo,
  } = filters;

  const kindsToExclude: TransactionKind[] = [];
  if (excludeTransfers) {
    kindsToExclude.push("TRANSFER", "CC_PAYMENT", "EXCLUDED");
  }

  return {
    userId,
    ...(type && type !== "ALL" ? { type } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(accountId ? { accountId } : {}),
    ...(paymentMethod ? { paymentMethod: { contains: paymentMethod, mode: "insensitive" } } : {}),
    ...(transactionKind && transactionKind !== "ALL" ? { transactionKind } : {}),
    ...(kindsToExclude.length > 0 ? { transactionKind: { notIn: kindsToExclude } } : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" as const } },
            { merchantName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(merchant
      ? { merchantName: { contains: merchant, mode: "insensitive" as const } }
      : {}),
    ...(minAmount !== undefined || maxAmount !== undefined
      ? {
          amount: {
            ...(minAmount !== undefined ? { gte: minAmount } : {}),
            ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
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
}

export async function getTransactions(userId: string, filters: TransactionFilters) {
  const { page, pageSize, sortBy, sortOrder } = filters;
  const where = buildWhere(userId, filters);

  const orderBy = buildOrderBy(sortBy, sortOrder);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, account: true },
      orderBy,
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

function buildOrderBy(
  sortBy: TransactionFilters["sortBy"],
  sortOrder: TransactionFilters["sortOrder"]
): Prisma.TransactionOrderByWithRelationInput {
  switch (sortBy) {
    case "categoryName":
      return { category: { name: sortOrder } };
    case "description":
      return { description: sortOrder };
    case "paymentMethod":
      return { paymentMethod: sortOrder };
    case "type":
      return { type: sortOrder };
    case "transactionKind":
      return { transactionKind: sortOrder };
    case "amount":
      return { amount: sortOrder };
    case "createdAt":
      return { createdAt: sortOrder };
    default:
      return { transactionDate: sortOrder };
  }
}

export async function getTransactionById(id: string, userId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true, account: true },
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
    accountId?: string;
    transactionKind?: TransactionKind;
    excludeFromTotals?: boolean;
  }
) {
  const classification = classifyTransaction(data.description, data.type, data.paymentMethod);
  const defaultAccount = await getOrCreateDefaultAccount(userId);

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
      accountId: data.accountId || defaultAccount.id,
      merchantName: classification.merchantName,
      transactionKind: data.transactionKind || classification.kind,
      excludeFromTotals: data.excludeFromTotals ?? classification.excludeFromTotals,
    },
    include: { category: true, account: true },
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
    accountId?: string;
    transactionKind?: TransactionKind;
    excludeFromTotals?: boolean;
  }
) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const classification = classifyTransaction(data.description, data.type, data.paymentMethod);

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
      accountId: data.accountId,
      merchantName: classification.merchantName,
      transactionKind: data.transactionKind || classification.kind,
      excludeFromTotals: data.excludeFromTotals ?? classification.excludeFromTotals,
    },
    include: { category: true, account: true },
  });
  return serializeTx(tx);
}

export async function deleteTransaction(id: string, userId: string) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.transaction.delete({ where: { id } });
}

export async function bulkUpdateTransactions(
  userId: string,
  ids: string[],
  data: { categoryId?: string; excludeFromTotals?: boolean; transactionKind?: TransactionKind }
) {
  return prisma.transaction.updateMany({
    where: { id: { in: ids }, userId },
    data,
  });
}

export async function bulkDeleteTransactions(userId: string, ids: string[]) {
  return prisma.transaction.deleteMany({
    where: { id: { in: ids }, userId },
  });
}

export async function getCategoryHistory(userId: string, limit = 500) {
  return prisma.transaction.findMany({
    where: { userId },
    select: {
      description: true,
      type: true,
      categoryId: true,
      category: { select: { name: true } },
    },
    orderBy: { transactionDate: "desc" },
    take: limit,
  });
}

export async function getRecentTransactions(userId: string, limit = 8) {
  const txns = await prisma.transaction.findMany({
    where: { userId },
    include: { category: true, account: true },
    orderBy: { transactionDate: "desc" },
    take: limit,
  });
  return txns.map(serializeTx);
}
