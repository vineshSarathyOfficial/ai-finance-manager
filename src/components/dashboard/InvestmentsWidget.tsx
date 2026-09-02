import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import type { InvestmentSummary, SerializedInvestment } from "@/types/investment";

interface InvestmentsWidgetProps {
  investments: SerializedInvestment[];
  summary: InvestmentSummary;
}

export function InvestmentsWidget({ investments, summary }: InvestmentsWidgetProps) {
  if (investments.length === 0) return null;

  const top = investments.filter((i) => i.isActive).slice(0, 3);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <TrendingUp className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" />
          <h3 className="title-md text-[var(--color-ink)]">Investments</h3>
        </div>
        <Link
          href="/investments"
          className="body-sm text-[var(--color-primary)] flex items-center gap-1 flex-shrink-0"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <p className="display-md text-[var(--color-ink)] mb-1 body-tabular">
        {formatCurrency(summary.totalValue)}
      </p>
      <p className="caption text-[var(--color-ink-muted)] mb-3">
        {formatCurrency(summary.monthlyCommitment)}/mo committed
      </p>

      <div className="space-y-2">
        {top.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between py-2 border-t border-[var(--color-hairline-soft)] first:border-0"
          >
            <span className="body-sm text-[var(--color-ink)] truncate">{inv.name}</span>
            <span className="body-sm font-medium body-tabular flex-shrink-0 ml-2">
              {formatCurrency(inv.currentValue)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
