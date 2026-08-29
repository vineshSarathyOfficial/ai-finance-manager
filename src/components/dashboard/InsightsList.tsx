import Link from "next/link";
import { ArrowRight, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Insight } from "@/lib/finance/insights";

const severityConfig = {
  warning: { icon: AlertTriangle, badge: "orange" as const, iconBg: "bg-[var(--color-accent-orange-bg)] text-[var(--color-accent-orange-deep)]" },
  info: { icon: Info, badge: "sky" as const, iconBg: "bg-[var(--color-accent-sky-bg)] text-[var(--color-accent-sky)]" },
  positive: { icon: TrendingUp, badge: "green" as const, iconBg: "bg-[var(--color-accent-green-bg)] text-[var(--color-accent-green)]" },
};

interface InsightsListProps {
  insights: Insight[];
  compact?: boolean;
}

export function InsightsList({ insights, compact }: InsightsListProps) {
  if (insights.length === 0) return null;

  const items = compact ? insights.slice(0, 3) : insights;

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="hidden lg:flex items-center justify-between">
          <h2 className="heading-2 text-[var(--color-ink)]">Insights</h2>
          <Link href="/insights" className="body-sm text-[var(--color-primary)] hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className={compact ? "space-y-2" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
        {items.map((insight) => {
          const config = severityConfig[insight.severity];
          const Icon = config.icon;
          return (
            <Link key={insight.id} href={insight.href}>
              <Card hover padding="md" className="h-full">
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0", config.iconBg)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="title-sm text-[var(--color-ink)]">{insight.title}</p>
                      <Badge variant={config.badge}>{insight.severity}</Badge>
                    </div>
                    <p className="body-sm text-[var(--color-ink-muted)] line-clamp-2">{insight.message}</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
