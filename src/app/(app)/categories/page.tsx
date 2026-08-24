import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCategories } from "@/lib/db/categories";
import { CategoriesClient } from "@/components/categories/CategoriesClient";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const userId = await getRequiredUserId();
  const categories = await getCategories(userId);

  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-2 text-[var(--color-ink)]">Categories</h1>
        <p className="body-sm text-[var(--color-ink-muted)] mt-1">
          Manage your income and expense categories
        </p>
      </div>
      <CategoriesClient incomeCategories={income} expenseCategories={expense} />
    </div>
  );
}
