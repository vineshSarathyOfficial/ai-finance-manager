import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCreditCardsDashboard } from "@/lib/finance/credit-cards";
import { CreditCardsDashboard } from "@/components/credit-cards/CreditCardsDashboard";
import { CreditCardsEmpty } from "@/components/credit-cards/CreditCardsEmpty";

export const metadata: Metadata = { title: "Credit Cards" };

export default async function CreditCardsPage() {
  const userId = await getRequiredUserId();
  const dashboard = await getCreditCardsDashboard(userId);

  if (!dashboard) {
    return <CreditCardsEmpty />;
  }

  return (
    <CreditCardsDashboard
      cards={dashboard.cards}
      overall={dashboard.overall}
      emiSummary={dashboard.emiSummary}
      recentTransactions={dashboard.recentTransactions}
      analytics={dashboard.analytics}
    />
  );
}
