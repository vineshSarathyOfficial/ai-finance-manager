import type { Metadata } from "next";
import { getRequiredUserId } from "@/lib/auth/session";
import { getRecurringTransactions, getRecurringSummary } from "@/actions/recurring";
import { prisma } from "@/lib/db/prisma";
import { RecurringSummaryCards } from "@/components/subscriptions/RecurringSummaryCards";
import { RecurringList } from "@/components/subscriptions/RecurringList";
import { SyncRecurringButton } from "@/components/subscriptions/SyncRecurringButton";
import { RotateCcw, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Subscriptions & Recurring",
  description: "Automatically detect and manage your recurring transactions, subscriptions, EMIs, and salary credits.",
};

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const userId = await getRequiredUserId();

  const [items, summary, txCount] = await Promise.all([
    getRecurringTransactions(userId),
    getRecurringSummary(userId),
    prisma.transaction.count({ where: { userId } }),
  ]);

  const hasTransactions = txCount >= 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-[var(--color-ink)] flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-[var(--color-primary)]" />
            Subscriptions &amp; Recurring
          </h1>
          <p className="body-sm text-[var(--color-ink-muted)] mt-1">
            Auto-detected recurring payments, subscriptions, EMIs, and salary credits
          </p>
        </div>
        <SyncRecurringButton hasTransactions={hasTransactions} />
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15">
        <Info className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
        <p className="caption text-[var(--color-ink-secondary)]">
          The detection engine scans your last 18 months of transactions, groups similar merchants,
          and measures interval regularity to identify subscriptions and recurring payments.
          Click <strong>Scan Transactions</strong> to refresh the analysis.
        </p>
      </div>

      {/* Summary cards */}
      <RecurringSummaryCards summary={summary} />

      {/* Recurring list */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[var(--radius-xl)] p-6">
        <h2 className="title text-[var(--color-ink)] mb-4">Detected Recurring Transactions</h2>
        <RecurringList items={items} />
      </div>
    </div>
  );
}
