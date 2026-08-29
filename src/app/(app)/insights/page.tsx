import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { generateInsights } from "@/lib/finance/insights";
import { PageHeader } from "@/components/ui/PageHeader";
import { InsightsList } from "@/components/dashboard/InsightsList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Lightbulb } from "lucide-react";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const userId = await getRequiredUserId();
  const insights = await generateInsights(userId, 20);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Insights"
        description="Actionable observations based on your transaction data"
      />

      {insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No insights yet"
          description="Import more transactions to unlock personalized spending insights."
          action={{ label: "Import Statement", href: "/import" }}
        />
      ) : (
        <InsightsList insights={insights} />
      )}
    </div>
  );
}
