"use client";

import { useState, useTransition, useEffect } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Loader2, ArrowRight } from "lucide-react";
import { getDashboardAiHealthAction, type AiHealthInsight } from "@/actions/ai";
import { AiAdvisorDrawer } from "@/components/ai/AiAdvisorDrawer";

export function DashboardAiCard() {
  const [insight, setInsight] = useState<AiHealthInsight | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  // If key is missing or no transactions yet, show a clean onboarding card
  if (error === "GEMINI_KEY_MISSING") {
    return (
      <>
        <div className="bg-gradient-to-r from-blue-50/80 via-emerald-50/40 to-teal-50/70 rounded-[var(--radius-xl)] border border-blue-100 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="title text-[var(--color-ink)] text-base">FinPulse AI Financial Health</h3>
              <p className="caption text-[var(--color-ink-muted)] mt-0.5">
                Enable AI insights &amp; conversational assistant with your free Gemini key
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-active)] transition-colors shadow-xs flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enable AI Copilot</span>
          </button>
        </div>

        <AiAdvisorDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-hairline)] p-5 sm:p-6 shadow-level-1 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="title text-[var(--color-ink)] text-base">
                  {insight?.headline || "AI Financial Health Overview"}
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  AI Live
                </span>
              </div>
              <p className="caption text-[var(--color-ink-muted)] mt-0.5">
                Real-time analysis of spending habits &amp; savings opportunities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas-soft)] transition-colors disabled:opacity-50"
              title="Refresh AI Insights"
            >
              <Loader2 className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] bg-blue-50 text-[var(--color-primary)] hover:bg-blue-100 text-xs font-semibold transition-colors"
            >
              <span>Ask Copilot</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3 Insight Blocks */}
        {isPending && !insight ? (
          <div className="flex items-center justify-center py-6 gap-2 text-[var(--color-ink-muted)] caption">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
            <span>Analyzing your transactions &amp; cashflow...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* Win */}
            <div className="p-3.5 rounded-[var(--radius-lg)] bg-emerald-50/50 border border-emerald-100/80">
              <div className="flex items-center gap-2 mb-1 text-emerald-800 font-semibold text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Financial Win</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                {insight?.win || "Consistent income tracking and balanced discretionary spend."}
              </p>
            </div>

            {/* Anomaly */}
            <div className="p-3.5 rounded-[var(--radius-lg)] bg-amber-50/50 border border-amber-100/80">
              <div className="flex items-center gap-2 mb-1 text-amber-800 font-semibold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Spending Watch</span>
              </div>
              <p className="text-xs text-amber-950 leading-relaxed">
                {insight?.anomaly || "Check your top spending categories for potential savings."}
              </p>
            </div>

            {/* Recommendation */}
            <div className="p-3.5 rounded-[var(--radius-lg)] bg-blue-50/50 border border-blue-100/80">
              <div className="flex items-center gap-2 mb-1 text-blue-800 font-semibold text-xs">
                <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
                <span>Next Smart Action</span>
              </div>
              <p className="text-xs text-blue-950 leading-relaxed">
                {insight?.recommendation || "Aim for a 20%+ savings rate by auditing subscriptions."}
              </p>
            </div>
          </div>
        )}
      </div>

      <AiAdvisorDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
