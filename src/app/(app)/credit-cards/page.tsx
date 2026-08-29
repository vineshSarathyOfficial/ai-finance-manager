import type { Metadata } from "next";
import Link from "next/link";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCreditCardSummary, getTopMerchants } from "@/lib/db/dashboard";
import { getMonthlyTrend } from "@/lib/finance/metrics";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { startOfMonth, endOfMonth } from "@/lib/utils";

export const metadata: Metadata = { title: "Credit Cards" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CreditCardsPage({ searchParams }: PageProps) {
  const userId = await getRequiredUserId();
  const sp = await searchParams;
  const cardId = typeof sp.cardId === "string" ? sp.cardId : undefined;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const dateFrom = monthStart.toISOString().slice(0, 10);
  const dateTo = monthEnd.toISOString().slice(0, 10);

  const [ccSummary, topMerchants] = await Promise.all([
    getCreditCardSummary(userId),
    getTopMerchants(userId, 5, monthStart, monthEnd),
  ]);

  if (!ccSummary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Credit Cards" description="Track credit card spending and trends" />
        <EmptyState
          icon={CreditCard}
          title="No credit card data"
          description="Import a credit card statement or add a credit card account to see spending analytics."
          action={{ label: "Import Statement", href: "/import" }}
        />
      </div>
    );
  }

  const ccAccounts = await prisma.account.findMany({
    where: { userId, type: "CREDIT_CARD" },
  });

  const accountFilter = cardId
    ? { accountId: cardId }
    : ccAccounts.length > 0
      ? { accountId: { in: ccAccounts.map((a) => a.id) } }
      : { paymentMethod: { contains: "Credit Card", mode: "insensitive" as const } };

  const [largestTxs, ccTrend] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        transactionDate: { gte: monthStart, lte: monthEnd },
        excludeFromTotals: false,
        ...accountFilter,
      },
      include: { category: true },
      orderBy: { amount: "desc" },
      take: 5,
    }),
    getMonthlyTrend(userId, 6, { accountId: cardId }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Cards"
        description={`${ccSummary.cardCount} card${ccSummary.cardCount !== 1 ? "s" : ""} · ${new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(now)}`}
      />

      {ccSummary.cards.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/credit-cards"
            className={`flex-shrink-0 px-4 py-2 rounded-[var(--radius-full)] body-sm border ${!cardId ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "border-[var(--color-hairline)] text-[var(--color-ink-muted)]"}`}
          >
            All Cards
          </Link>
          {ccSummary.cards.map((card: { id: string; name: string; amount: number }) => (
            <Link
              key={card.id}
              href={`/credit-cards?cardId=${card.id}`}
              className={`flex-shrink-0 px-4 py-2 rounded-[var(--radius-full)] body-sm border ${cardId === card.id ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "border-[var(--color-hairline)] text-[var(--color-ink-muted)]"}`}
            >
              {card.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard label="Total CC Spend" value={ccSummary.totalSpend} format="currency" variant="primary" icon={CreditCard} />
        <StatCard
          label="Transactions"
          value={largestTxs.length}
          format="number"
          href={`/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}&type=EXPENSE`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <CardTitle>Top Merchants</CardTitle>
          <div className="mt-4 space-y-2">
            {topMerchants.map((m: { name: string; totalAmount: number }) => (
              <Link
                key={m.name}
                href={`/transactions?search=${encodeURIComponent(m.name)}&dateFrom=${dateFrom}&dateTo=${dateTo}`}
                className="flex items-center justify-between py-2 border-b border-[var(--color-hairline-soft)] last:border-0"
              >
                <span className="body-sm">{m.name}</span>
                <div className="flex items-center gap-2">
                  <span className="body-sm font-medium">{formatCurrency(m.totalAmount)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--color-ink-faint)]" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card padding="md">
          <CardTitle>Largest Transactions</CardTitle>
          <div className="mt-4 space-y-2">
            {largestTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[var(--color-hairline-soft)] last:border-0">
                <div className="min-w-0">
                  <p className="body-sm text-[var(--color-ink)] truncate">{tx.merchantName || tx.description}</p>
                  <p className="caption-sm text-[var(--color-ink-muted)]">{formatDate(tx.transactionDate)} · {tx.category.name}</p>
                </div>
                <span className="body-sm font-medium flex-shrink-0 ml-2">{formatCurrency(tx.amount.toNumber())}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="md">
        <CardTitle>Monthly Trend</CardTitle>
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ccTrend.map((m) => (
            <div key={m.month} className="text-center p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-soft)]">
              <p className="caption-sm text-[var(--color-ink-muted)]">{m.month}</p>
              <p className="body-sm font-medium mt-1">{formatCurrency(m.expenses)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
