"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
} from "@/lib/db/goals";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  currentAmount: z.string().optional(),
  targetDate: z.string().optional(),
  icon: z.string().optional(),
});

export async function getSavingsGoalsAction() {
  const userId = await getRequiredUserId();
  return getSavingsGoals(userId);
}

export async function createSavingsGoalAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || undefined,
    targetDate: formData.get("targetDate") || undefined,
    icon: formData.get("icon") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid goal data." };
  }

  await createSavingsGoal(userId, {
    name: parsed.data.name,
    targetAmount: parseFloat(parsed.data.targetAmount),
    currentAmount: parsed.data.currentAmount ? parseFloat(parsed.data.currentAmount) : 0,
    targetDate: parsed.data.targetDate,
    icon: parsed.data.icon,
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true, message: "Goal created." };
}

export async function updateSavingsGoalAction(id: string, formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = goalSchema.safeParse({
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount") || undefined,
    targetDate: formData.get("targetDate") || undefined,
    icon: formData.get("icon") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid goal data." };
  }

  const result = await updateSavingsGoal(id, userId, {
    name: parsed.data.name,
    targetAmount: parseFloat(parsed.data.targetAmount),
    currentAmount: parsed.data.currentAmount ? parseFloat(parsed.data.currentAmount) : 0,
    targetDate: parsed.data.targetDate ?? null,
    icon: parsed.data.icon ?? null,
  });

  if (!result) return { success: false, message: "Goal not found." };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true, message: "Goal updated." };
}

export async function deleteSavingsGoalAction(id: string) {
  const userId = await getRequiredUserId();
  const result = await deleteSavingsGoal(id, userId);
  if (!result) return { success: false, message: "Goal not found." };

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true, message: "Goal deleted." };
}
