import Link from "next/link";
import { AlertTriangle, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Insight } from "@/lib/finance/insight-engine/types";

const severityConfig = {
  warning: { icon: AlertTriangle, badge: "orange" as const, iconBg: "bg-[var(--color-accent-orange-bg)] text-[var(--color-accent-orange-deep)]" },
  info: { icon: Info, badge: "sky" as const, iconBg: "bg-[var(--color-accent-sky-bg)] text-[var(--color-accent-sky)]" },
  positive: { icon: TrendingUp, badge: "green" as const, iconBg: "bg-[var(--color-accent-green-bg)] text-[var(--color-accent-green)]" },
};

interface InsightObservationsProps {
  insights: Insight[];
}

export function InsightObservations({ insights }: InsightObservationsProps) {
  if (insights.length === 0) {
    return (
      <p className="body-sm text-[var(--color-ink-muted)] text-center py-6">
        Not enough data for detailed observations in this period.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="title text-[var(--color-ink)]">Observations</h2>
      <div className="space-y-2">
        {insights.map((insight) => {
          const config = severityConfig[insight.severity];
          const Icon = config.icon;
          return (
            <Link key={insight.id} href={insight.href}>
              <Card hover padding="md">
                <div className="flex items-start gap-3">
                  <div className={cn("w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0", config.iconBg)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="title-sm text-[var(--color-ink)]">{insight.title}</p>
                      <Badge variant={config.badge}>{insight.severity}</Badge>
                    </div>
                    <p className="body-sm text-[var(--color-ink-muted)]">{insight.message}</p>
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
