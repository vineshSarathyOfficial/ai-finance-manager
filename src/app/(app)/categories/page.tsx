import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCategories } from "@/lib/db/categories";
import { getCategoryRules } from "@/lib/db/category-rules";
import { CategoriesClient } from "@/components/categories/CategoriesClient";
import { CategoryRulesSection } from "@/components/categories/CategoryRulesSection";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const userId = await getRequiredUserId();
  const [categories, rules] = await Promise.all([
    getCategories(userId),
    getCategoryRules(userId),
  ]);

  const income = categories.filter((c) => c.type === "INCOME");
  const expense = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Categories"
        description="Manage your income and expense categories"
      />
      <CategoriesClient incomeCategories={income} expenseCategories={expense} />
      <CategoryRulesSection rules={rules} categories={categories} />
    </div>
  );
}
