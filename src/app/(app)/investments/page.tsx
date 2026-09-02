import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getInvestments, computeInvestmentSummary } from "@/lib/db/investments";
import { PageHeader } from "@/components/ui/PageHeader";
import { InvestmentsClient } from "@/components/investments/InvestmentsClient";

export const metadata: Metadata = {
  title: "Investments",
  description: "Track SIPs, EPFO, and other investments.",
};

export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const userId = await getRequiredUserId();
  const investments = await getInvestments(userId);
  const summary = computeInvestmentSummary(investments);

  return (
    <div className="space-y-4 lg:space-y-6">
      <PageHeader
        title="Investments"
        description="Track SIPs, EPFO, FDs and your portfolio value"
      />
      <InvestmentsClient investments={investments} summary={summary} />
    </div>
  );
}
