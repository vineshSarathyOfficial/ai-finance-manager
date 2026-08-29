"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  createTransaction as dbCreate,
  updateTransaction as dbUpdate,
  deleteTransaction as dbDelete,
  bulkDeleteTransactions as dbBulkDelete,
} from "@/lib/db/transactions";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "@/lib/validations/transaction";

type ActionState =
  | { success: true; message: string }
  | { success: false; message: string; errors?: Record<string, string[]> }
  | undefined;

export async function createTransactionAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getRequiredUserId();

  const parsed = createTransactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    transactionDate: formData.get("transactionDate"),
    paymentMethod: formData.get("paymentMethod") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Validation failed.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await dbCreate(userId, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/analytics");
    return { success: true, message: "Transaction added successfully." };
  } catch {
    return { success: false, message: "Failed to create transaction. Please try again." };
  }
}

export async function updateTransactionAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getRequiredUserId();

  const parsed = updateTransactionSchema.safeParse({
    id: formData.get("id"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    transactionDate: formData.get("transactionDate"),
    paymentMethod: formData.get("paymentMethod") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Validation failed.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await dbUpdate(parsed.data.id, userId, parsed.data);
    if (!result) {
      return { success: false, message: "Transaction not found." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/analytics");
    return { success: true, message: "Transaction updated successfully." };
  } catch {
    return { success: false, message: "Failed to update transaction. Please try again." };
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionState> {
  const userId = await getRequiredUserId();

  try {
    const result = await dbDelete(id, userId);
    if (!result) {
      return { success: false, message: "Transaction not found." };
    }
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/analytics");
    return { success: true, message: "Transaction deleted." };
  } catch {
    return { success: false, message: "Failed to delete transaction. Please try again." };
  }
}

export async function bulkDeleteTransactionsAction(ids: string[]): Promise<ActionState> {
  const userId = await getRequiredUserId();

  if (!ids.length) {
    return { success: false, message: "No transactions selected." };
  }

  try {
    const result = await dbBulkDelete(userId, ids);
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    revalidatePath("/analytics");
    return {
      success: true,
      message: `Deleted ${result.count} transaction${result.count === 1 ? "" : "s"}.`,
    };
  } catch {
    return { success: false, message: "Failed to delete transactions. Please try again." };
  }
}
