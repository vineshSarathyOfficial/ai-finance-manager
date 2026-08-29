import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCategories } from "@/lib/db/categories";
import { CategoriesClient } from "@/components/categories/CategoriesClient";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const userId = await getRequiredUserId();
  const categories = await getCategories(userId);

  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Categories"
        description="Manage your income and expense categories"
      />
      <CategoriesClient incomeCategories={income} expenseCategories={expense} />
    </div>
  );
}
