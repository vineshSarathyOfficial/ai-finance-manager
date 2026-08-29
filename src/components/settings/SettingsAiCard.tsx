"use client";

import { useState, useEffect } from "react";
import { Sparkles, Key, Check, Eye, EyeOff, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAiCopilot } from "@/components/ai/AiCopilotContext";

export function SettingsAiCard() {
  const { open } = useAiCopilot();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = localStorage.getItem("finpulse_gemini_api_key");
    if (existing) {
      setApiKey(existing);
      setSaved(true);
    }
  }, []);

  function handleSave() {
    if (!apiKey.trim()) {
      localStorage.removeItem("finpulse_gemini_api_key");
      setSaved(false);
      toast.success("AI key cleared. Using server environment if configured.");
      return;
    }

    localStorage.setItem("finpulse_gemini_api_key", apiKey.trim());
    setSaved(true);
    toast.success("Gemini API key saved.");
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] overflow-hidden">
      <div className="px-5 py-4 bg-[var(--color-canvas-soft)] border-b border-[var(--color-hairline)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="title text-[var(--color-ink)]">FinPulse AI</h2>
            <p className="caption text-[var(--color-ink-muted)]">Chat &amp; automated insights</p>
          </div>
        </div>
        <button
          type="button"
          onClick={open}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface)] button-sm text-[var(--color-ink)] hover:bg-[var(--color-canvas)] shadow-level-1 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-[var(--color-primary)]" />
          Open chat
        </button>
      </div>

      <div className="px-5 py-5 space-y-4">
        <div>
          <p className="body-sm font-medium text-[var(--color-ink)]">Google Gemini API key</p>
          <p className="caption text-[var(--color-ink-muted)] mt-1">
            Stored in your browser only. Get a free key from{" "}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-primary)] hover:underline"
            >
              Google AI Studio
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Key className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setSaved(false);
              }}
              placeholder="AIzaSy…"
              className="w-full pl-9 pr-9 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] bg-[var(--color-canvas-soft)] body-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:shadow-level-1"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
              aria-label={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] button-sm hover:bg-[var(--color-primary-active)] transition-colors flex-shrink-0"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Saved" : "Save key"}
          </button>
        </div>
      </div>
    </div>
  );
}
