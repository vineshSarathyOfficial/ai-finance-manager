import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getRecurringTransactions, getRecurringSummary } from "@/actions/recurring";
import { prisma } from "@/lib/db/prisma";
import { RecurringSummaryCards } from "@/components/subscriptions/RecurringSummaryCards";
import { RecurringList } from "@/components/subscriptions/RecurringList";
import { SyncRecurringButton } from "@/components/subscriptions/SyncRecurringButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Recurring",
  description: "Automatically detect and manage recurring transactions, subscriptions, and EMIs.",
};

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const userId = await getRequiredUserId();

  const [items, summary, txCount] = await Promise.all([
    getRecurringTransactions(userId),
    getRecurringSummary(userId),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring"
        description="Auto-detected subscriptions, EMIs, and recurring payments"
        action={<SyncRecurringButton hasTransactions={txCount >= 2} />}
      />

      <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15">
        <Info className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
        <p className="body-sm text-[var(--color-ink-secondary)]">
          Scans your last 18 months of transactions to identify recurring patterns.
          Estimated yearly cost is shown for each item.
        </p>
      </div>

      <RecurringSummaryCards summary={summary} />

      <Card padding="lg">
        <h2 className="display-sm text-[var(--color-ink)] mb-4">Detected Recurring</h2>
        <RecurringList items={items} />
      </Card>
    </div>
  );
}
