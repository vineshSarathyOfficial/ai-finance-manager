import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { InvestmentType } from "@prisma/client";
import type { InvestmentSummary, SerializedInvestment } from "@/types/investment";

function toNum(d: { toNumber(): number } | null | undefined): number | null {
  if (d == null) return null;
  return d.toNumber();
}

function serializeInvestment(
  inv: Awaited<ReturnType<typeof prisma.investment.findMany>>[number]
): SerializedInvestment {
  return {
    id: inv.id,
    type: inv.type as SerializedInvestment["type"],
    name: inv.name,
    institution: inv.institution,
    currentValue: inv.currentValue.toNumber(),
    investedAmount: toNum(inv.investedAmount),
    monthlyContribution: toNum(inv.monthlyContribution),
    employerContribution: toNum(inv.employerContribution),
    startDate: inv.startDate?.toISOString() ?? null,
    targetAmount: toNum(inv.targetAmount),
    notes: inv.notes,
    lastValueUpdate: inv.lastValueUpdate?.toISOString() ?? null,
    isActive: inv.isActive,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  };
}

export function computeInvestmentSummary(
  investments: SerializedInvestment[]
): InvestmentSummary {
  const active = investments.filter((i) => i.isActive);
  const totalValue = active.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = active.reduce((s, i) => s + (i.investedAmount ?? 0), 0);
  const monthlyCommitment = active.reduce((s, i) => {
    const employee = i.monthlyContribution ?? 0;
    const employer = i.employerContribution ?? 0;
    return s + employee + employer;
  }, 0);

  return {
    totalValue,
    totalInvested,
    monthlyCommitment,
    sipCount: active.filter((i) => i.type === "SIP").length,
    epfoCount: active.filter((i) => i.type === "EPFO").length,
    gainLoss: totalInvested > 0 ? totalValue - totalInvested : null,
  };
}

export async function getInvestments(userId: string) {
  const rows = await prisma.investment.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { type: "asc" }, { name: "asc" }],
  });
  return rows.map(serializeInvestment);
}

export async function getInvestmentById(id: string, userId: string) {
  const row = await prisma.investment.findFirst({ where: { id, userId } });
  return row ? serializeInvestment(row) : null;
}

export async function createInvestment(
  userId: string,
  data: {
    type: InvestmentType;
    name: string;
    institution?: string;
    currentValue: string;
    investedAmount?: string;
    monthlyContribution?: string;
    employerContribution?: string;
    startDate?: string;
    targetAmount?: string;
    notes?: string;
  }
) {
  const row = await prisma.investment.create({
    data: {
      userId,
      type: data.type,
      name: data.name,
      institution: data.institution,
      currentValue: parseFloat(data.currentValue),
      investedAmount: data.investedAmount ? parseFloat(data.investedAmount) : undefined,
      monthlyContribution: data.monthlyContribution
        ? parseFloat(data.monthlyContribution)
        : undefined,
      employerContribution: data.employerContribution
        ? parseFloat(data.employerContribution)
        : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      targetAmount: data.targetAmount ? parseFloat(data.targetAmount) : undefined,
      notes: data.notes,
      lastValueUpdate: new Date(),
    },
  });
  return serializeInvestment(row);
}

export async function updateInvestment(
  id: string,
  userId: string,
  data: {
    type?: InvestmentType;
    name?: string;
    institution?: string;
    currentValue?: string;
    investedAmount?: string;
    monthlyContribution?: string;
    employerContribution?: string;
    startDate?: string;
    targetAmount?: string;
    notes?: string;
    isActive?: boolean;
  }
) {
  const existing = await prisma.investment.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const valueChanged =
    data.currentValue !== undefined &&
    parseFloat(data.currentValue) !== existing.currentValue.toNumber();

  const row = await prisma.investment.update({
    where: { id },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.institution !== undefined ? { institution: data.institution } : {}),
      ...(data.currentValue !== undefined
        ? { currentValue: parseFloat(data.currentValue) }
        : {}),
      ...(data.investedAmount !== undefined
        ? { investedAmount: data.investedAmount ? parseFloat(data.investedAmount) : null }
        : {}),
      ...(data.monthlyContribution !== undefined
        ? {
            monthlyContribution: data.monthlyContribution
              ? parseFloat(data.monthlyContribution)
              : null,
          }
        : {}),
      ...(data.employerContribution !== undefined
        ? {
            employerContribution: data.employerContribution
              ? parseFloat(data.employerContribution)
              : null,
          }
        : {}),
      ...(data.startDate !== undefined
        ? { startDate: data.startDate ? new Date(data.startDate) : null }
        : {}),
      ...(data.targetAmount !== undefined
        ? { targetAmount: data.targetAmount ? parseFloat(data.targetAmount) : null }
        : {}),
      ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(valueChanged ? { lastValueUpdate: new Date() } : {}),
    },
  });
  return serializeInvestment(row);
}

export async function updateInvestmentValue(
  id: string,
  userId: string,
  data: { currentValue: string; investedAmount?: string }
) {
  return updateInvestment(id, userId, {
    currentValue: data.currentValue,
    investedAmount: data.investedAmount,
  });
}

export async function deleteInvestment(id: string, userId: string) {
  const existing = await prisma.investment.findFirst({ where: { id, userId } });
  if (!existing) return null;
  return prisma.investment.delete({ where: { id } });
}
