import Link from "next/link";
import { CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { CreditUtilizationBar } from "./CreditUtilizationBar";
import type { SerializedCreditCard } from "@/types/credit-card";

interface CreditCardTileProps {
  card: SerializedCreditCard;
}

export function CreditCardTile({ card }: CreditCardTileProps) {
  const { metrics } = card;
  const displayName = card.lastFour
    ? `${card.name} ···${card.lastFour}`
    : card.name;

  return (
    <Link href={`/credit-cards/${card.id}`}>
      <Card padding="md" hover className="h-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--color-error-bg)] flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-[var(--color-error)]" />
            </div>
            <div className="min-w-0">
              <p className="body-sm font-medium text-[var(--color-ink)] truncate">{displayName}</p>
              {card.institution && (
                <p className="caption text-[var(--color-ink-muted)] truncate">{card.institution}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Limit</p>
            <p className="body-sm font-medium body-tabular">
              {metrics.creditLimit != null ? formatCurrency(metrics.creditLimit) : "—"}
            </p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Outstanding</p>
            <p className="body-sm font-medium body-tabular text-[var(--color-ink)]">
              {formatCurrency(metrics.currentOutstanding)}
            </p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Available</p>
            <p className="body-sm font-medium body-tabular">
              {metrics.availableCredit != null ? formatCurrency(metrics.availableCredit) : "—"}
            </p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Active EMIs</p>
            <p className="body-sm font-medium">{metrics.activeEmiCount}</p>
          </div>
        </div>

        <CreditUtilizationBar utilizationPct={metrics.utilizationPct} />
      </Card>
    </Link>
  );
}
