import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCreditCardDetail } from "@/lib/finance/credit-cards";
import { getCreditCardTransactions } from "@/lib/finance/credit-cards";
import { CreditCardDetailView } from "@/components/credit-cards/CreditCardDetailView";
import { transactionFiltersSchema } from "@/lib/validations/transaction";

export const metadata: Metadata = { title: "Credit Card Details" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CreditCardDetailPage({ params }: PageProps) {
  const userId = await getRequiredUserId();
  const { id } = await params;

  const detail = await getCreditCardDetail(userId, id);
  if (!detail) notFound();

  const { total } = await getCreditCardTransactions(
    userId,
    id,
    transactionFiltersSchema.parse({ page: 1, pageSize: 1 })
  );

  return (
    <CreditCardDetailView
      card={detail.card}
      emis={detail.emis}
      analytics={detail.analytics}
      transactionCount={total}
    />
  );
}
