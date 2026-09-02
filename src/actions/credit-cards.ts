"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  createCreditCard,
  updateCreditCard,
  createCreditCardEmi,
  updateCreditCardEmi,
  deleteCreditCardEmi,
  getCreditCardById,
} from "@/lib/db/credit-cards";
import {
  createCreditCardSchema,
  updateCreditCardSchema,
  createCreditCardEmiSchema,
  updateCreditCardEmiSchema,
} from "@/lib/validations/credit-card";

function revalidateCreditCards(accountId?: string) {
  revalidatePath("/credit-cards");
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/credit-cards/${accountId}`);
}

export async function createCreditCardAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = createCreditCardSchema.safeParse({
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    lastFour: formData.get("lastFour") || undefined,
    creditLimit: formData.get("creditLimit") || undefined,
    openingOutstanding: formData.get("openingOutstanding") || undefined,
    billingCycleDay: formData.get("billingCycleDay") || undefined,
    paymentDueDay: formData.get("paymentDueDay") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid card data." };
  }

  const card = await createCreditCard(userId, parsed.data);
  revalidateCreditCards(card.id);
  return { success: true, message: "Credit card added.", id: card.id };
}

export async function updateCreditCardAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = updateCreditCardSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    lastFour: formData.get("lastFour") || undefined,
    creditLimit: formData.get("creditLimit") || undefined,
    openingOutstanding: formData.get("openingOutstanding") || undefined,
    billingCycleDay: formData.get("billingCycleDay") || undefined,
    paymentDueDay: formData.get("paymentDueDay") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid card data." };
  }

  const { id, ...data } = parsed.data;
  const card = await updateCreditCard(id, userId, data);
  if (!card) return { success: false, message: "Card not found." };

  revalidateCreditCards(id);
  return { success: true, message: "Credit card updated." };
}

export async function createCreditCardEmiAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = createCreditCardEmiSchema.safeParse({
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    originalAmount: formData.get("originalAmount"),
    monthlyAmount: formData.get("monthlyAmount"),
    remainingPrincipal: formData.get("remainingPrincipal"),
    totalTenureMonths: formData.get("totalTenureMonths"),
    remainingMonths: formData.get("remainingMonths"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    interestRate: formData.get("interestRate") || undefined,
    processingFee: formData.get("processingFee") || undefined,
    convertedTransactionId: formData.get("convertedTransactionId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid EMI data." };
  }

  const emi = await createCreditCardEmi(userId, parsed.data);
  if (!emi) return { success: false, message: "Card not found." };

  revalidateCreditCards(parsed.data.accountId);
  return { success: true, message: "EMI added." };
}

export async function updateCreditCardEmiAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = updateCreditCardEmiSchema.safeParse({
    id: formData.get("id"),
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    originalAmount: formData.get("originalAmount"),
    monthlyAmount: formData.get("monthlyAmount"),
    remainingPrincipal: formData.get("remainingPrincipal"),
    totalTenureMonths: formData.get("totalTenureMonths"),
    remainingMonths: formData.get("remainingMonths"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    interestRate: formData.get("interestRate") || undefined,
    processingFee: formData.get("processingFee") || undefined,
    status: formData.get("status") || undefined,
    convertedTransactionId: formData.get("convertedTransactionId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid EMI data." };
  }

  const { id, accountId, ...data } = parsed.data;
  const emi = await updateCreditCardEmi(id, userId, data);
  if (!emi) return { success: false, message: "EMI not found." };

  revalidateCreditCards(accountId);
  return { success: true, message: "EMI updated." };
}

export async function deleteCreditCardEmiAction(id: string, accountId: string) {
  const userId = await getRequiredUserId();
  const card = await getCreditCardById(accountId, userId);
  if (!card) return { success: false, message: "Card not found." };

  const result = await deleteCreditCardEmi(id, userId);
  if (!result) return { success: false, message: "EMI not found." };

  revalidateCreditCards(accountId);
  return { success: true, message: "EMI removed." };
}
