"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  createInvestment,
  deleteInvestment,
  getInvestments,
  updateInvestment,
  updateInvestmentValue,
} from "@/lib/db/investments";
import {
  investmentSchema,
  updateInvestmentSchema,
  updateInvestmentValueSchema,
} from "@/lib/validations/investment";

function revalidateInvestments() {
  revalidatePath("/investments");
  revalidatePath("/dashboard");
}

export async function createInvestmentAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = investmentSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    currentValue: formData.get("currentValue"),
    investedAmount: formData.get("investedAmount") || undefined,
    monthlyContribution: formData.get("monthlyContribution") || undefined,
    employerContribution: formData.get("employerContribution") || undefined,
    startDate: formData.get("startDate") || undefined,
    targetAmount: formData.get("targetAmount") || undefined,
    notes: formData.get("notes") || undefined,
    isActive: formData.get("isActive") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid investment data." };
  }

  await createInvestment(userId, parsed.data);
  revalidateInvestments();
  return { success: true, message: "Investment added." };
}

export async function updateInvestmentAction(id: string, formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = updateInvestmentSchema.safeParse({
    id,
    type: formData.get("type"),
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    currentValue: formData.get("currentValue"),
    investedAmount: formData.get("investedAmount") || undefined,
    monthlyContribution: formData.get("monthlyContribution") || undefined,
    employerContribution: formData.get("employerContribution") || undefined,
    startDate: formData.get("startDate") || undefined,
    targetAmount: formData.get("targetAmount") || undefined,
    notes: formData.get("notes") || undefined,
    isActive: formData.get("isActive") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid investment data." };
  }

  const { id: _id, isActive, ...data } = parsed.data;
  const result = await updateInvestment(id, userId, {
    ...data,
    isActive: isActive ?? true,
  });
  if (!result) return { success: false, message: "Investment not found." };

  revalidateInvestments();
  return { success: true, message: "Investment updated." };
}

export async function updateInvestmentValueAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = updateInvestmentValueSchema.safeParse({
    id: formData.get("id"),
    currentValue: formData.get("currentValue"),
    investedAmount: formData.get("investedAmount") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid value." };
  }

  const result = await updateInvestmentValue(parsed.data.id, userId, {
    currentValue: parsed.data.currentValue,
    investedAmount: parsed.data.investedAmount,
  });
  if (!result) return { success: false, message: "Investment not found." };

  revalidateInvestments();
  return { success: true, message: "Value updated." };
}

export async function deleteInvestmentAction(id: string) {
  const userId = await getRequiredUserId();
  const result = await deleteInvestment(id, userId);
  if (!result) return { success: false, message: "Investment not found." };

  revalidateInvestments();
  return { success: true, message: "Investment removed." };
}

export async function getInvestmentsAction() {
  const userId = await getRequiredUserId();
  return getInvestments(userId);
}
