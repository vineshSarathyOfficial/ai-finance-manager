"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { CreditUtilizationBar } from "./CreditUtilizationBar";
import { CreditCardFormModal } from "./CreditCardFormModal";
import { CreditCardEmiSection } from "./CreditCardEmiSection";
import { CreditCardAnalyticsSection } from "./CreditCardAnalyticsSection";
import type {
  SerializedCreditCard,
  SerializedCreditCardEmi,
  CreditCardAnalytics,
} from "@/types/credit-card";

interface CreditCardDetailViewProps {
  card: SerializedCreditCard;
  emis: SerializedCreditCardEmi[];
  analytics: CreditCardAnalytics;
  transactionCount: number;
}

export function CreditCardDetailView({
  card,
  emis,
  analytics,
  transactionCount,
}: CreditCardDetailViewProps) {
  const [showEdit, setShowEdit] = useState(false);
  const { metrics } = card;
  const displayName = card.lastFour ? `${card.name} ···${card.lastFour}` : card.name;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/credit-cards"
          className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-canvas-soft)]"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--color-ink-muted)]" />
        </Link>
        <PageHeader
          title={displayName}
          description={card.institution ?? "Credit Card"}
          className="flex-1 min-w-0"
          action={
            <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          }
        />
      </div>

      <Card padding="md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[var(--color-error)]" />
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Current outstanding</p>
            <p className="text-2xl font-semibold body-tabular">{formatCurrency(metrics.currentOutstanding)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Credit limit</p>
            <p className="body-sm font-medium body-tabular">
              {metrics.creditLimit != null ? formatCurrency(metrics.creditLimit) : "—"}
            </p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Available</p>
            <p className="body-sm font-medium body-tabular">
              {metrics.availableCredit != null ? formatCurrency(metrics.availableCredit) : "—"}
            </p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Opening balance</p>
            <p className="body-sm font-medium body-tabular">{formatCurrency(metrics.openingOutstanding)}</p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">New spending</p>
            <p className="body-sm font-medium body-tabular">{formatCurrency(metrics.newSpending)}</p>
          </div>
        </div>

        <CreditUtilizationBar utilizationPct={metrics.utilizationPct} className="mb-4" />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--color-hairline-soft)]">
          {metrics.billingCycleLabel && (
            <div>
              <p className="caption text-[var(--color-ink-muted)]">Billing cycle</p>
              <p className="body-sm">{metrics.billingCycleLabel}</p>
            </div>
          )}
          {metrics.paymentDueLabel && (
            <div>
              <p className="caption text-[var(--color-ink-muted)]">Payment due</p>
              <p className="body-sm">{metrics.paymentDueLabel}</p>
            </div>
          )}
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Payments received</p>
            <p className="body-sm body-tabular text-[var(--color-income)]">
              {formatCurrency(metrics.totalPayments)}
            </p>
          </div>
        </div>
      </Card>

      <Card padding="md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Transactions</CardTitle>
            <p className="caption text-[var(--color-ink-muted)] mt-1">
              {transactionCount} credit card transaction{transactionCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href={`/transactions?accountId=${card.id}`}>
            <Button size="sm" variant="secondary">
              View & filter
            </Button>
          </Link>
        </div>
        <p className="body-sm text-[var(--color-ink-muted)] mt-3">
          Only transactions linked to this credit card account are shown. Payments reduce outstanding and are not counted as spending.
        </p>
      </Card>

      <CreditCardEmiSection accountId={card.id} emis={emis} />

      <CreditCardAnalyticsSection analytics={analytics} title="Spending Analytics" />

      <CreditCardFormModal open={showEdit} onClose={() => setShowEdit(false)} card={card} />
    </div>
  );
}
