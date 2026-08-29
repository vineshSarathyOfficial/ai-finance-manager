import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { getRequiredUserId } from "@/lib/auth/session";
import { getOrCreateInsightReport } from "@/lib/db/insight-reports";
import { getTodayPeriodKey, insightsUrl } from "@/lib/finance/periods";
import { Card } from "@/components/ui/Card";

export async function LatestInsightCard() {
  const userId = await getRequiredUserId();
  const todayKey = getTodayPeriodKey();
  const report = await getOrCreateInsightReport(userId, "daily", todayKey);

  if (!report.facts.hasEnoughData && report.insights.length === 0) {
    return null;
  }

  const headline =
    report.summaryText ||
    (report.facts.expenses > 0
      ? `You spent ₹${report.facts.expenses.toLocaleString("en-IN")} today.`
      : "Check your daily financial insights.");

  return (
    <Card padding="md" className="border-[var(--color-primary)]/20 bg-[var(--color-primary-bg-subdued)]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="eyebrow text-[var(--color-primary)] uppercase mb-1">Today&apos;s Insight</p>
          <p className="body-sm text-[var(--color-ink)] leading-relaxed">{headline}</p>
          <Link
            href={insightsUrl("daily", todayKey)}
            className="inline-flex items-center gap-1 mt-2 caption text-[var(--color-primary)] font-medium hover:underline"
          >
            View Insights <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
