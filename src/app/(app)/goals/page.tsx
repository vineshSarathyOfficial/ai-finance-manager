import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getSavingsGoals } from "@/lib/db/goals";
import { PageHeader } from "@/components/ui/PageHeader";
import { GoalsClient } from "@/components/goals/GoalsClient";

export const metadata: Metadata = {
  title: "Savings Goals",
  description: "Track progress toward your savings targets.",
};

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const userId = await getRequiredUserId();
  const goals = await getSavingsGoals(userId);

  return (
    <div className="space-y-4 lg:space-y-6 max-w-3xl">
      <PageHeader
        title="Savings Goals"
        description="Set targets and track how much you've saved"
      />
      <GoalsClient goals={goals} />
    </div>
  );
}
