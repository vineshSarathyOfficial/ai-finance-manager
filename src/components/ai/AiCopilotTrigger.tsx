"use client";

import { Sparkles } from "lucide-react";
import { useAiCopilot } from "./AiCopilotContext";
import { cn } from "@/lib/utils";

export function AiCopilotTrigger() {
  const { open, isOpen } = useAiCopilot();

  return (
    <button
      id="open-ai-copilot-btn"
      type="button"
      onClick={open}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      className={cn(
        "fixed z-40 transition-all active:scale-[0.97]",
        "bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 lg:bottom-6 lg:right-6",
        "lg:flex lg:items-center lg:gap-2.5 lg:pl-2 lg:pr-4 lg:py-2",
        "lg:rounded-[var(--radius-full)] lg:bg-[var(--color-surface)] lg:border lg:border-[var(--color-hairline)] lg:shadow-level-2",
        "lg:hover:bg-[var(--color-canvas)]",
        "w-12 h-12 lg:w-auto lg:h-auto rounded-[var(--radius-full)]",
        "bg-[var(--color-primary)] lg:bg-[var(--color-surface)]",
        "flex items-center justify-center"
      )}
      title="Ask FinPulse AI"
      aria-label="Ask FinPulse AI"
    >
      <span className="flex items-center justify-center w-9 h-9 lg:w-8 lg:h-8 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] lg:flex-shrink-0">
        <Sparkles className="w-4 h-4" />
      </span>
      <span className="hidden lg:inline button-sm text-[var(--color-ink)]">Ask AI</span>
    </button>
  );
}
