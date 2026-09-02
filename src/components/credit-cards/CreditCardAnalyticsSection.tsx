import { formatCurrency } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/Card";

interface AnalyticsData {
  spendThisMonth: number;
  spendLastMonth: number;
  topMerchants: Array<{ name: string; totalAmount: number }>;
  categoryBreakdown: Array<{ name: string; icon: string | null; amount: number }>;
  monthlyTrend: Array<{ month: string; expenses: number }>;
}

interface CreditCardAnalyticsSectionProps {
  analytics: AnalyticsData;
  title?: string;
}

export function CreditCardAnalyticsSection({
  analytics,
  title = "Spending Analytics",
}: CreditCardAnalyticsSectionProps) {
  const spendChange =
    analytics.spendLastMonth > 0
      ? Math.round(
          ((analytics.spendThisMonth - analytics.spendLastMonth) / analytics.spendLastMonth) * 100
        )
      : null;

  return (
    <div className="space-y-4">
      <Card padding="md">
        <CardTitle>{title}</CardTitle>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="caption text-[var(--color-ink-muted)]">This month</p>
            <p className="text-lg font-semibold body-tabular">{formatCurrency(analytics.spendThisMonth)}</p>
          </div>
          <div>
            <p className="caption text-[var(--color-ink-muted)]">Last month</p>
            <p className="text-lg font-semibold body-tabular">
              {formatCurrency(analytics.spendLastMonth)}
              {spendChange != null && (
                <span className="caption text-[var(--color-ink-muted)] ml-1">
                  ({spendChange > 0 ? "+" : ""}
                  {spendChange}%)
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardTitle>Top Merchants</CardTitle>
          <div className="mt-4 space-y-2">
            {analytics.topMerchants.length === 0 ? (
              <p className="body-sm text-[var(--color-ink-muted)]">No spending this month.</p>
            ) : (
              analytics.topMerchants.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <span className="body-sm truncate">{m.name}</span>
                  <span className="body-sm font-medium flex-shrink-0 ml-2">
                    {formatCurrency(m.totalAmount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card padding="md">
          <CardTitle>By Category</CardTitle>
          <div className="mt-4 space-y-2">
            {analytics.categoryBreakdown.length === 0 ? (
              <p className="body-sm text-[var(--color-ink-muted)]">No spending this month.</p>
            ) : (
              analytics.categoryBreakdown.slice(0, 6).map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between py-2 border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <span className="body-sm">{c.name}</span>
                  <span className="body-sm font-medium">{formatCurrency(c.amount)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card padding="md">
        <CardTitle>Monthly Trend</CardTitle>
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-3">
          {analytics.monthlyTrend.map((m) => (
            <div
              key={m.month}
              className="text-center p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-soft)]"
            >
              <p className="caption-sm text-[var(--color-ink-muted)]">{m.month}</p>
              <p className="body-sm font-medium mt-1 body-tabular">{formatCurrency(m.expenses)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
