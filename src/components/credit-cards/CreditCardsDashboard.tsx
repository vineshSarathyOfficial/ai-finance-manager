"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CreditCardTile } from "./CreditCardTile";
import { CreditUtilizationBar } from "./CreditUtilizationBar";
import { CreditCardFormModal } from "./CreditCardFormModal";
import { CreditCardAnalyticsSection } from "./CreditCardAnalyticsSection";
import type { SerializedCreditCard, CreditCardAnalytics } from "@/types/credit-card";
import { Badge } from "@/components/ui/Badge";

interface RecentTx {
  id: string;
  description: string;
  merchantName: string | null;
  amount: number;
  type: string;
  transactionDate: string;
  transactionKind: string;
  category: { name: string };
}

interface CreditCardsDashboardProps {
  cards: SerializedCreditCard[];
  overall: {
    totalLimit: number | null;
    totalOutstanding: number;
    availableCredit: number | null;
    utilizationPct: number | null;
  };
  emiSummary: { activeCount: number; monthlyTotal: number };
  recentTransactions: RecentTx[];
  analytics: CreditCardAnalytics;
}

export function CreditCardsDashboard({
  cards,
  overall,
  emiSummary,
  recentTransactions,
  analytics,
}: CreditCardsDashboardProps) {
  const [showAddCard, setShowAddCard] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Credit Cards"
        description="Manage your cards, outstanding balances and EMI commitments."
        action={
          <Button size="sm" onClick={() => setShowAddCard(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Credit Card</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      {overall.totalLimit != null && overall.totalLimit > 0 && (
        <Card padding="md">
          <p className="caption text-[var(--color-ink-muted)] mb-2">Overall Credit Utilization</p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
            <p className="text-xl font-semibold body-tabular text-[var(--color-ink)]">
              {formatCurrency(overall.totalOutstanding)}
              <span className="body-sm text-[var(--color-ink-muted)] font-normal">
                {" "}
                / {formatCurrency(overall.totalLimit)}
              </span>
            </p>
            {overall.availableCredit != null && (
              <p className="caption text-[var(--color-ink-muted)]">
                {formatCurrency(overall.availableCredit)} available
              </p>
            )}
          </div>
          <CreditUtilizationBar utilizationPct={overall.utilizationPct} showLabel={false} />
        </Card>
      )}

      <div>
        <h2 className="title-md text-[var(--color-ink)] mb-3">Your Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((card) => (
            <CreditCardTile key={card.id} card={card} />
          ))}
        </div>
      </div>

      <Card padding="md">
        <CardTitle>EMI Commitments</CardTitle>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Monthly EMI</p>
            <p className="text-lg font-semibold body-tabular">{formatCurrency(emiSummary.monthlyTotal)}</p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Active EMIs</p>
            <p className="text-lg font-semibold">{emiSummary.activeCount}</p>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <CardTitle>Recent Credit Card Transactions</CardTitle>
          {cards.length === 1 && (
            <Link
              href={`/transactions?accountId=${cards[0].id}`}
              className="body-sm text-[var(--color-primary)] flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
        {recentTransactions.length === 0 ? (
          <p className="body-sm text-[var(--color-ink-muted)]">No credit card transactions yet.</p>
        ) : (
          <div className="space-y-1">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 border-b border-[var(--color-hairline-soft)] last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="body-sm text-[var(--color-ink)] truncate">
                    {tx.merchantName || tx.description}
                  </p>
                  <p className="caption text-[var(--color-ink-muted)]">
                    {formatDate(tx.transactionDate)} · {tx.category.name}
                    {tx.transactionKind === "CC_PAYMENT" && (
                      <Badge variant="muted" className="ml-1.5">
                        Payment
                      </Badge>
                    )}
                  </p>
                </div>
                <span
                  className={`body-sm font-medium flex-shrink-0 ml-2 body-tabular ${
                    tx.type === "INCOME" ? "text-[var(--color-income)]" : "text-[var(--color-ink)]"
                  }`}
                >
                  {tx.type === "INCOME" ? "+" : ""}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CreditCardAnalyticsSection analytics={analytics} />

      <CreditCardFormModal open={showAddCard} onClose={() => setShowAddCard(false)} />
    </div>
  );
}
