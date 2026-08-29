import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getBudgetsAction } from "@/actions/budgets";
import { getCategories } from "@/lib/db/categories";
import { PageHeader } from "@/components/ui/PageHeader";
import { BudgetsClient } from "@/components/budgets/BudgetsClient";

export const metadata: Metadata = { title: "Budgets" };

export default async function BudgetsPage() {
  const userId = await getRequiredUserId();
  const [budgets, categories] = await Promise.all([
    getBudgetsAction(),
    getCategories(userId),
  ]);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Budgets"
        description="Set monthly spending limits by category"
      />
      <BudgetsClient budgets={budgets} categories={categories} />
    </div>
  );
}
