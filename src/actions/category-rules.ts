"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  createCategoryRule,
  deleteCategoryRule,
  getCategoryRules,
} from "@/lib/db/category-rules";
import { z } from "zod";

const createRuleSchema = z.object({
  keyword: z.string().min(1).max(100).trim(),
  categoryId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export async function getCategoryRulesAction() {
  const userId = await getRequiredUserId();
  return getCategoryRules(userId);
}

export async function createCategoryRuleAction(formData: FormData) {
  const userId = await getRequiredUserId();
  const parsed = createRuleSchema.safeParse({
    keyword: formData.get("keyword"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { success: false, message: "Invalid rule data." };
  }

  try {
    await createCategoryRule(userId, parsed.data);
    revalidatePath("/categories");
    return { success: true, message: "Rule created." };
  } catch {
    return { success: false, message: "A rule with this keyword already exists." };
  }
}

export async function deleteCategoryRuleAction(id: string) {
  const userId = await getRequiredUserId();
  await deleteCategoryRule(id, userId);
  revalidatePath("/categories");
  return { success: true, message: "Rule deleted." };
}

export async function createRuleFromDescriptionAction(
  description: string,
  categoryId: string,
  type: "INCOME" | "EXPENSE"
) {
  const userId = await getRequiredUserId();
  const keyword = description.trim().slice(0, 80);
  if (!keyword) return { success: false, message: "Description is too short for a rule." };

  try {
    await createCategoryRule(userId, { keyword, categoryId, type });
    revalidatePath("/categories");
    return { success: true, message: "Categorization rule saved." };
  } catch {
    return { success: false, message: "Could not save rule (may already exist)." };
  }
}
