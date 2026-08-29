"use server";

import { revalidatePath } from "next/cache";
import { getRequiredUserId } from "@/lib/auth/session";
import {
  createCategory as dbCreate,
  updateCategory as dbUpdate,
  deleteCategory as dbDelete,
  getCategories,
} from "@/lib/db/categories";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required.").max(50).trim(),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().optional(),
});

type ActionState =
  | { success: true; message: string }
  | { success: false; message: string; errors?: Record<string, string[]> }
  | undefined;

export async function getCategoriesAction() {
  const userId = await getRequiredUserId();
  return getCategories(userId);
}

export async function createCategoryAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getRequiredUserId();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    icon: formData.get("icon") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Validation failed.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await dbCreate(userId, parsed.data);
    revalidatePath("/categories");
    revalidatePath("/transactions");
    return { success: true, message: "Category created." };
  } catch (e: unknown) {
    // Unique constraint violation
    if ((e as { code?: string })?.code === "P2002") {
      return { success: false, message: "A category with this name and type already exists." };
    }
    return { success: false, message: "Failed to create category." };
  }
}

export async function updateCategoryAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const userId = await getRequiredUserId();
  const id = formData.get("id") as string;

  const parsed = categorySchema.pick({ name: true, icon: true }).safeParse({
    name: formData.get("name"),
    icon: formData.get("icon") || undefined,
  });

  if (!parsed.success) {
    return { success: false, message: "Validation failed.", errors: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await dbUpdate(id, userId, parsed.data);
    if (!result) return { success: false, message: "Category not found." };
    revalidatePath("/categories");
    return { success: true, message: "Category updated." };
  } catch {
    return { success: false, message: "Failed to update category." };
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionState> {
  const userId = await getRequiredUserId();

  try {
    const result = await dbDelete(id, userId);
    if (!result) return { success: false, message: "Category not found." };
    revalidatePath("/categories");
    return { success: true, message: "Category deleted." };
  } catch {
    return { success: false, message: "Failed to delete category. It may still have transactions." };
  }
}
