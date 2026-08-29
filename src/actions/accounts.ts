"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  createAccount,
  deleteAccount,
  getAccounts,
  getAccountBalances,
  updateAccount,
} from "@/lib/db/accounts";
import { createAccountSchema } from "@/lib/validations/transaction";

export async function getAccountsAction() {
  const userId = await getRequiredUserId();
  return getAccounts(userId);
}

export async function getAccountBalancesAction() {
  const userId = await getRequiredUserId();
  return getAccountBalances(userId);
}

export async function createAccountAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = createAccountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    institution: formData.get("institution") || undefined,
    lastFour: formData.get("lastFour") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid account data." };
  }

  await createAccount(userId, parsed.data);
  revalidatePath("/accounts");
  return { success: true, message: "Account created." };
}

export async function deleteAccountAction(id: string) {
  const userId = await getRequiredUserId();
  const result = await deleteAccount(id, userId);
  if (result.error) return { success: false, message: result.error };
  revalidatePath("/accounts");
  return { success: true, message: "Account deleted." };
}
