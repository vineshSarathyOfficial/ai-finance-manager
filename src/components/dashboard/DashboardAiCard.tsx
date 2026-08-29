"use client";

import { useState, useTransition, useEffect } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2, MessageCircle } from "lucide-react";
import { getDashboardAiHealthAction, type AiHealthInsight } from "@/actions/ai";
import { useAiCopilot } from "@/components/ai/AiCopilotContext";

export function DashboardAiCard() {
  const { open } = useAiCopilot();
  const [insight, setInsight] = useState<AiHealthInsight | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const customKey = localStorage.getItem("finpulse_gemini_api_key") || undefined;
    startTransition(async () => {
      const res = await getDashboardAiHealthAction(customKey);
      if (res.success && res.data) {
        setInsight(res.data);
        setError(null);
      } else {
        setError(res.error || "Could not generate insights.");
      }
    });
  }, []);

  function handleRefresh() {
    const customKey = localStorage.getItem("finpulse_gemini_api_key") || undefined;
    startTransition(async () => {
      const res = await getDashboardAiHealthAction(customKey);
      if (res.success && res.data) {
        setInsight(res.data);
        setError(null);
      } else {
        setError(res.error || "Could not generate insights.");
      }
    });
  }

  if (error === "GEMINI_KEY_MISSING") {
    return (
      <div className="bg-[var(--color-secondary)] rounded-[var(--radius-lg)] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[var(--color-on-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-white/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="eyebrow text-white/70">FinPulse AI</p>
            <h3 className="heading-3 text-white">Unlock spending insights</h3>
            <p className="caption text-white/75 mt-1">
              Add a free Gemini key to get personalized analysis &amp; chat
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-full)] bg-[var(--color-surface)] text-[var(--color-ink)] button-sm hover:bg-[var(--color-canvas-soft)] transition-colors flex-shrink-0 shadow-level-1"
        >
          <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
          Set up AI
        </button>
      </div>
    );
  }

  const blocks = [
    {
      icon: TrendingUp,
      label: "Win",
      text: insight?.win || "Consistent income tracking and balanced spend.",
      bg: "bg-[var(--color-accent-green-bg)]",
      color: "text-[var(--color-accent-green)]",
    },
    {
      icon: AlertTriangle,
      label: "Watch",
      text: insight?.anomaly || "Check top categories for savings.",
      bg: "bg-[var(--color-accent-orange-bg)]",
      color: "text-[var(--color-accent-orange-deep)]",
    },
    {
      icon: Lightbulb,
      label: "Try this",
      text: insight?.recommendation || "Audit subscriptions to boost savings.",
      bg: "bg-[var(--color-accent-sky-bg)]",
      color: "text-[var(--color-accent-sky)]",
    },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)] flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="heading-3 text-[var(--color-ink)] truncate">
              {insight?.headline || "AI snapshot"}
            </h3>
            <p className="caption text-[var(--color-ink-muted)]">Updated from your latest data</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="p-2 rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            title="Refresh insights"
          >
            <Loader2 className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] button-sm hover:bg-[var(--color-primary-active)] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>

      {isPending && !insight ? (
        <div className="flex items-center justify-center py-10 gap-2 caption text-[var(--color-ink-muted)]">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
          Analyzing your finances…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--color-hairline)]">
          {blocks.map(({ icon: Icon, label, text, bg, color }) => (
            <div key={label} className="p-5">
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-full)] ${bg} mb-3`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className={`eyebrow ${color}`}>{label}</span>
              </div>
              <p className="body-sm text-[var(--color-ink-secondary)] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
