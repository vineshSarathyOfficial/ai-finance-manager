import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { Account, Prisma, TransactionKind } from "@prisma/client";
import {
  startOfMonth,
  endOfMonth,
  startOfPrevMonth,
  endOfPrevMonth,
} from "@/lib/utils";
import type { TransactionFilters } from "@/lib/validations/transaction";
import type {
  CreditCardMetrics,
  SerializedCreditCard,
  SerializedCreditCardEmi,
} from "@/types/credit-card";

export type { CreditCardMetrics, SerializedCreditCard, SerializedCreditCardEmi };

const SPEND_EXCLUDED_KINDS: TransactionKind[] = ["TRANSFER", "CC_PAYMENT", "EXCLUDED"];

function toNum(d: { toNumber(): number } | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : d.toNumber();
}

export async function getCreditCardAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId, type: "CREDIT_CARD" },
    orderBy: { name: "asc" },
  });
}

export async function getCreditCardAccountIds(userId: string): Promise<string[]> {
  const accounts = await getCreditCardAccounts(userId);
  return accounts.map((a) => a.id);
}

export async function creditCardTransactionWhere(
  userId: string,
  accountId?: string
): Promise<Prisma.TransactionWhereInput | null> {
  if (accountId) {
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId, type: "CREDIT_CARD" },
    });
    if (!account) return null;
    return { userId, accountId };
  }

  const accountIds = await getCreditCardAccountIds(userId);
  if (accountIds.length === 0) return null;
  return { userId, accountId: { in: accountIds } };
}

function computeTransactionDelta(
  txs: Array<{
    type: string;
    amount: { toNumber(): number };
    transactionKind: TransactionKind;
    excludeFromTotals: boolean;
  }>
) {
  let spending = 0;
  let payments = 0;
  let refunds = 0;

  for (const tx of txs) {
    const amt = tx.amount.toNumber();
    if (tx.type === "EXPENSE") {
      if (SPEND_EXCLUDED_KINDS.includes(tx.transactionKind)) continue;
      if (tx.excludeFromTotals) continue;
      spending += amt;
    } else if (tx.type === "INCOME") {
      if (tx.transactionKind === "CC_PAYMENT") {
        payments += amt;
      } else if (tx.transactionKind === "REFUND") {
        refunds += amt;
      }
    }
  }

  return {
    delta: spending - payments - refunds,
    spending,
    payments,
    refunds,
  };
}

function computeUtilization(outstanding: number, creditLimit: number | null) {
  if (creditLimit == null || creditLimit <= 0) {
    return { availableCredit: null, utilizationPct: null };
  }
  const availableCredit = Math.max(0, creditLimit - outstanding);
  const utilizationPct = Math.round((outstanding / creditLimit) * 1000) / 10;
  return { availableCredit, utilizationPct };
}

function formatBillingCycle(billingCycleDay: number | null): string | null {
  if (!billingCycleDay) return null;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  let cycleStart: Date;
  let cycleEnd: Date;

  if (day >= billingCycleDay) {
    cycleStart = new Date(year, month, billingCycleDay);
    cycleEnd = new Date(year, month + 1, billingCycleDay - 1);
  } else {
    cycleStart = new Date(year, month - 1, billingCycleDay);
    cycleEnd = new Date(year, month, billingCycleDay - 1);
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(cycleStart)} – ${fmt(cycleEnd)}`;
}

function formatPaymentDue(paymentDueDay: number | null): string | null {
  if (!paymentDueDay) return null;
  const now = new Date();
  let due = new Date(now.getFullYear(), now.getMonth(), paymentDueDay);
  if (due < now) {
    due = new Date(now.getFullYear(), now.getMonth() + 1, paymentDueDay);
  }
  return due.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function computeCardMetrics(
  account: Account,
  userId: string
): Promise<CreditCardMetrics> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevStart = startOfPrevMonth(now);
  const prevEnd = endOfPrevMonth(now);

  const [allTxs, monthTxs, prevMonthTxs, activeEmis] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, accountId: account.id },
      select: { type: true, amount: true, transactionKind: true, excludeFromTotals: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        accountId: account.id,
        type: "EXPENSE",
        transactionDate: { gte: monthStart, lte: monthEnd },
        excludeFromTotals: false,
        transactionKind: { notIn: SPEND_EXCLUDED_KINDS },
      },
      select: { amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        accountId: account.id,
        type: "EXPENSE",
        transactionDate: { gte: prevStart, lte: prevEnd },
        excludeFromTotals: false,
        transactionKind: { notIn: SPEND_EXCLUDED_KINDS },
      },
      select: { amount: true },
    }),
    prisma.creditCardEmi.findMany({
      where: { userId, accountId: account.id, status: "ACTIVE" },
      select: { monthlyAmount: true, remainingPrincipal: true },
    }),
  ]);

  const { delta, spending, payments, refunds } = computeTransactionDelta(allTxs);
  const openingOutstanding = toNum(account.openingOutstanding);
  const currentOutstanding = openingOutstanding + delta;
  const creditLimit = account.creditLimit ? toNum(account.creditLimit) : null;
  const { availableCredit, utilizationPct } = computeUtilization(
    currentOutstanding,
    creditLimit
  );

  return {
    creditLimit,
    openingOutstanding,
    currentOutstanding,
    availableCredit,
    utilizationPct,
    newSpending: spending,
    totalPayments: payments,
    totalRefunds: refunds,
    spendThisMonth: monthTxs.reduce((s, t) => s + t.amount.toNumber(), 0),
    spendLastMonth: prevMonthTxs.reduce((s, t) => s + t.amount.toNumber(), 0),
    activeEmiCount: activeEmis.length,
    monthlyEmiCommitment: activeEmis.reduce((s, e) => s + e.monthlyAmount.toNumber(), 0),
    emiOutstanding: activeEmis.reduce((s, e) => s + e.remainingPrincipal.toNumber(), 0),
    billingCycleLabel: formatBillingCycle(account.billingCycleDay),
    paymentDueLabel: formatPaymentDue(account.paymentDueDay),
  };
}

function serializeAccount(account: Account, metrics: CreditCardMetrics): SerializedCreditCard {
  return {
    id: account.id,
    name: account.name,
    institution: account.institution,
    lastFour: account.lastFour,
    creditLimit: metrics.creditLimit,
    openingOutstanding: metrics.openingOutstanding,
    billingCycleDay: account.billingCycleDay,
    paymentDueDay: account.paymentDueDay,
    metrics,
  };
}

function serializeEmi(
  emi: Awaited<ReturnType<typeof prisma.creditCardEmi.findMany>>[number]
): SerializedCreditCardEmi {
  return {
    id: emi.id,
    accountId: emi.accountId,
    name: emi.name,
    originalAmount: emi.originalAmount.toNumber(),
    monthlyAmount: emi.monthlyAmount.toNumber(),
    remainingPrincipal: emi.remainingPrincipal.toNumber(),
    totalTenureMonths: emi.totalTenureMonths,
    remainingMonths: emi.remainingMonths,
    startDate: emi.startDate.toISOString(),
    endDate: emi.endDate?.toISOString() ?? null,
    interestRate: emi.interestRate ? emi.interestRate.toNumber() : null,
    processingFee: emi.processingFee ? emi.processingFee.toNumber() : null,
    status: emi.status,
  };
}

export async function getCreditCardsDashboard(userId: string) {
  const accounts = await getCreditCardAccounts(userId);
  if (accounts.length === 0) return null;

  const cards = await Promise.all(
    accounts.map(async (account) => {
      const metrics = await computeCardMetrics(account, userId);
      return serializeAccount(account, metrics);
    })
  );

  const totalLimit = cards.reduce((s, c) => s + (c.creditLimit ?? 0), 0);
  const totalOutstanding = cards.reduce((s, c) => s + c.metrics.currentOutstanding, 0);
  const hasLimits = cards.some((c) => c.creditLimit != null && c.creditLimit > 0);
  const overallUtil = hasLimits && totalLimit > 0
    ? Math.round((totalOutstanding / totalLimit) * 1000) / 10
    : null;

  const allEmis = await prisma.creditCardEmi.findMany({
    where: { userId, status: "ACTIVE" },
  });

  const monthlyEmiTotal = allEmis.reduce((s, e) => s + e.monthlyAmount.toNumber(), 0);

  const where = await creditCardTransactionWhere(userId);
  const recentTxs = where
    ? await prisma.transaction.findMany({
        where,
        include: { category: { select: { name: true } } },
        orderBy: { transactionDate: "desc" },
        take: 10,
      })
    : [];

  const analytics = await getCreditCardAnalytics(userId);

  return {
    cards,
    overall: {
      totalLimit: hasLimits ? totalLimit : null,
      totalOutstanding,
      availableCredit: hasLimits && totalLimit > 0 ? Math.max(0, totalLimit - totalOutstanding) : null,
      utilizationPct: overallUtil,
    },
    emiSummary: {
      activeCount: allEmis.length,
      monthlyTotal: monthlyEmiTotal,
    },
    recentTransactions: recentTxs.map((tx) => ({
      id: tx.id,
      description: tx.description,
      merchantName: tx.merchantName,
      amount: tx.amount.toNumber(),
      type: tx.type,
      transactionDate: tx.transactionDate.toISOString(),
      transactionKind: tx.transactionKind,
      category: { name: tx.category.name },
    })),
    analytics,
  };
}

export async function getCreditCardDetail(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId, type: "CREDIT_CARD" },
  });
  if (!account) return null;

  const metrics = await computeCardMetrics(account, userId);
  const card = serializeAccount(account, metrics);

  const emis = await prisma.creditCardEmi.findMany({
    where: { userId, accountId },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  const analytics = await getCreditCardAnalytics(userId, accountId);

  return {
    card,
    emis: emis.map(serializeEmi),
    analytics,
  };
}

export async function getCreditCardAnalytics(userId: string, accountId?: string) {
  const where = await creditCardTransactionWhere(userId, accountId);
  if (!where) {
    return {
      spendThisMonth: 0,
      spendLastMonth: 0,
      topMerchants: [] as Array<{ name: string; totalAmount: number }>,
      categoryBreakdown: [] as Array<{ name: string; icon: string | null; amount: number }>,
      monthlyTrend: [] as Array<{ month: string; expenses: number }>,
    };
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevStart = startOfPrevMonth(now);
  const prevEnd = endOfPrevMonth(now);

  const spendWhere = {
    ...where,
    type: "EXPENSE" as const,
    excludeFromTotals: false,
    transactionKind: { notIn: SPEND_EXCLUDED_KINDS },
  };

  const [monthTxs, prevMonthTxs, allSpendTxs] = await Promise.all([
    prisma.transaction.findMany({
      where: { ...spendWhere, transactionDate: { gte: monthStart, lte: monthEnd } },
      select: { amount: true, merchantName: true, description: true, category: { select: { name: true, icon: true } } },
    }),
    prisma.transaction.findMany({
      where: { ...spendWhere, transactionDate: { gte: prevStart, lte: prevEnd } },
      select: { amount: true },
    }),
    prisma.transaction.findMany({
      where: spendWhere,
      select: { amount: true, merchantName: true, description: true, transactionDate: true, category: { select: { name: true, icon: true } } },
      orderBy: { transactionDate: "desc" },
      take: 2000,
    }),
  ]);

  const merchantMap = new Map<string, number>();
  for (const tx of monthTxs) {
    const name = tx.merchantName || tx.description;
    merchantMap.set(name, (merchantMap.get(name) ?? 0) + tx.amount.toNumber());
  }
  const topMerchants = Array.from(merchantMap.entries())
    .map(([name, totalAmount]) => ({ name, totalAmount }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  const categoryMap = new Map<string, { name: string; icon: string | null; amount: number }>();
  for (const tx of monthTxs) {
    const key = tx.category.name;
    const existing = categoryMap.get(key);
    if (existing) {
      existing.amount += tx.amount.toNumber();
    } else {
      categoryMap.set(key, { name: tx.category.name, icon: tx.category.icon, amount: tx.amount.toNumber() });
    }
  }
  const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);

  const monthlyTrend: Array<{ month: string; expenses: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthTotal = allSpendTxs
      .filter((t) => {
        const d = new Date(t.transactionDate);
        return d >= start && d <= end;
      })
      .reduce((s, t) => s + t.amount.toNumber(), 0);
    monthlyTrend.push({
      month: new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date),
      expenses: monthTotal,
    });
  }

  return {
    spendThisMonth: monthTxs.reduce((s, t) => s + t.amount.toNumber(), 0),
    spendLastMonth: prevMonthTxs.reduce((s, t) => s + t.amount.toNumber(), 0),
    topMerchants,
    categoryBreakdown,
    monthlyTrend,
  };
}

export async function getCreditCardTransactions(
  userId: string,
  accountId: string,
  filters: TransactionFilters
) {
  const baseWhere = await creditCardTransactionWhere(userId, accountId);
  if (!baseWhere) return { transactions: [], total: 0, pageCount: 0 };

  const { page, pageSize, sortBy, sortOrder, ...rest } = filters;

  const where: Prisma.TransactionWhereInput = {
    ...baseWhere,
    ...(rest.type && rest.type !== "ALL" ? { type: rest.type } : {}),
    ...(rest.categoryId ? { categoryId: rest.categoryId } : {}),
    ...(rest.search
      ? {
          OR: [
            { description: { contains: rest.search, mode: "insensitive" } },
            { merchantName: { contains: rest.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(rest.minAmount !== undefined || rest.maxAmount !== undefined
      ? {
          amount: {
            ...(rest.minAmount !== undefined ? { gte: rest.minAmount } : {}),
            ...(rest.maxAmount !== undefined ? { lte: rest.maxAmount } : {}),
          },
        }
      : {}),
    ...(rest.dateFrom || rest.dateTo
      ? {
          transactionDate: {
            ...(rest.dateFrom ? { gte: new Date(rest.dateFrom) } : {}),
            ...(rest.dateTo ? { lte: new Date(`${rest.dateTo}T23:59:59`) } : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    sortBy === "categoryName"
      ? { category: { name: sortOrder } }
      : sortBy === "amount"
        ? { amount: sortOrder }
        : sortBy === "description"
          ? { description: sortOrder }
          : { transactionDate: sortOrder };

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
    transactions: transactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      type: tx.type,
      amount: tx.amount.toNumber(),
      description: tx.description,
      categoryId: tx.categoryId,
      category: tx.category,
      transactionDate: tx.transactionDate.toISOString(),
      paymentMethod: tx.paymentMethod,
      notes: tx.notes,
      accountId: tx.accountId,
      merchantName: tx.merchantName,
      transactionKind: tx.transactionKind,
      linkedTransactionId: tx.linkedTransactionId,
      emiId: tx.emiId,
      excludeFromTotals: tx.excludeFromTotals,
      importId: tx.importId,
      source: tx.source,
      emailMessageId: tx.emailMessageId,
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString(),
    })),
    total,
    pageCount: Math.ceil(total / pageSize),
  };
}

/** Utilization thresholds — documented in CreditUtilizationBar */
export { getUtilizationLevel } from "@/lib/finance/credit-card-utils";
