import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { EmiStatus } from "@prisma/client";

export async function createCreditCard(
  userId: string,
  data: {
    name: string;
    institution?: string;
    lastFour?: string;
    creditLimit?: string;
    openingOutstanding?: string;
    billingCycleDay?: number;
    paymentDueDay?: number;
  }
) {
  return prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: "CREDIT_CARD",
      institution: data.institution,
      lastFour: data.lastFour,
      creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : undefined,
      openingOutstanding: data.openingOutstanding
        ? parseFloat(data.openingOutstanding)
        : 0,
      billingCycleDay: data.billingCycleDay,
      paymentDueDay: data.paymentDueDay,
    },
  });
}

export async function updateCreditCard(
  id: string,
  userId: string,
  data: {
    name?: string;
    institution?: string;
    lastFour?: string;
    creditLimit?: string;
    openingOutstanding?: string;
    billingCycleDay?: number;
    paymentDueDay?: number;
  }
) {
  const existing = await prisma.account.findFirst({
    where: { id, userId, type: "CREDIT_CARD" },
  });
  if (!existing) return null;

  return prisma.account.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.institution !== undefined ? { institution: data.institution } : {}),
      ...(data.lastFour !== undefined ? { lastFour: data.lastFour } : {}),
      ...(data.creditLimit !== undefined
        ? { creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : null }
        : {}),
      ...(data.openingOutstanding !== undefined
        ? { openingOutstanding: parseFloat(data.openingOutstanding) }
        : {}),
      ...(data.billingCycleDay !== undefined ? { billingCycleDay: data.billingCycleDay } : {}),
      ...(data.paymentDueDay !== undefined ? { paymentDueDay: data.paymentDueDay } : {}),
    },
  });
}

export async function getCreditCardById(id: string, userId: string) {
  return prisma.account.findFirst({
    where: { id, userId, type: "CREDIT_CARD" },
  });
}

export async function createCreditCardEmi(
  userId: string,
  data: {
    accountId: string;
    name: string;
    originalAmount: string;
    monthlyAmount: string;
    remainingPrincipal: string;
    totalTenureMonths: number;
    remainingMonths: number;
    startDate: string;
    endDate?: string;
    interestRate?: string;
    processingFee?: string;
    convertedTransactionId?: string;
  }
) {
  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId, type: "CREDIT_CARD" },
  });
  if (!account) return null;

  const emi = await prisma.creditCardEmi.create({
    data: {
      userId,
      accountId: data.accountId,
      name: data.name,
      originalAmount: parseFloat(data.originalAmount),
      monthlyAmount: parseFloat(data.monthlyAmount),
      remainingPrincipal: parseFloat(data.remainingPrincipal),
      totalTenureMonths: data.totalTenureMonths,
      remainingMonths: data.remainingMonths,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      interestRate: data.interestRate ? parseFloat(data.interestRate) : undefined,
      processingFee: data.processingFee ? parseFloat(data.processingFee) : undefined,
      convertedTransactionId: data.convertedTransactionId,
    },
  });

  if (data.convertedTransactionId) {
    await prisma.transaction.updateMany({
      where: { id: data.convertedTransactionId, userId, accountId: data.accountId },
      data: { excludeFromTotals: true, emiId: emi.id },
    });
  }

  return emi;
}

export async function updateCreditCardEmi(
  id: string,
  userId: string,
  data: {
    name?: string;
    originalAmount?: string;
    monthlyAmount?: string;
    remainingPrincipal?: string;
    totalTenureMonths?: number;
    remainingMonths?: number;
    startDate?: string;
    endDate?: string;
    interestRate?: string;
    processingFee?: string;
    status?: EmiStatus;
    convertedTransactionId?: string;
  }
) {
  const existing = await prisma.creditCardEmi.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  const emi = await prisma.creditCardEmi.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.originalAmount !== undefined
        ? { originalAmount: parseFloat(data.originalAmount) }
        : {}),
      ...(data.monthlyAmount !== undefined
        ? { monthlyAmount: parseFloat(data.monthlyAmount) }
        : {}),
      ...(data.remainingPrincipal !== undefined
        ? { remainingPrincipal: parseFloat(data.remainingPrincipal) }
        : {}),
      ...(data.totalTenureMonths !== undefined
        ? { totalTenureMonths: data.totalTenureMonths }
        : {}),
      ...(data.remainingMonths !== undefined ? { remainingMonths: data.remainingMonths } : {}),
      ...(data.startDate !== undefined ? { startDate: new Date(data.startDate) } : {}),
      ...(data.endDate !== undefined
        ? { endDate: data.endDate ? new Date(data.endDate) : null }
        : {}),
      ...(data.interestRate !== undefined
        ? { interestRate: data.interestRate ? parseFloat(data.interestRate) : null }
        : {}),
      ...(data.processingFee !== undefined
        ? { processingFee: data.processingFee ? parseFloat(data.processingFee) : null }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.convertedTransactionId !== undefined
        ? { convertedTransactionId: data.convertedTransactionId || null }
        : {}),
    },
  });

  if (data.convertedTransactionId) {
    await prisma.transaction.updateMany({
      where: { id: data.convertedTransactionId, userId },
      data: { excludeFromTotals: true, emiId: emi.id },
    });
  }

  return emi;
}

export async function deleteCreditCardEmi(id: string, userId: string) {
  const existing = await prisma.creditCardEmi.findFirst({ where: { id, userId } });
  if (!existing) return null;

  await prisma.transaction.updateMany({
    where: { emiId: id },
    data: { emiId: null, excludeFromTotals: false },
  });

  return prisma.creditCardEmi.delete({ where: { id } });
}
