import { Lightbulb } from "lucide-react";

interface InsightBannerProps {
  message: string;
}

export function InsightBanner({ message }: InsightBannerProps) {
  return (
    <div className="flex items-start gap-3 bg-[var(--color-secondary)]/5 border border-[var(--color-secondary)]/15 rounded-[var(--radius-lg)] px-4 py-3.5">
      <Lightbulb className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
      <p className="body-sm text-[var(--color-ink-secondary)]">
        <span className="font-medium text-[var(--color-ink)]">Insight: </span>
        {message}
      </p>
    </div>
  );
}
