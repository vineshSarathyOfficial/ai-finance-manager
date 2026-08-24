"use client";

import { useState, useEffect } from "react";
import { Sparkles, Key, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function SettingsAiCard() {
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
      toast.success("AI Key cleared. Falling back to environment variables.");
      return;
    }

    localStorage.setItem("finpulse_gemini_api_key", apiKey.trim());
    setSaved(true);
    toast.success("Gemini API Key saved successfully!");
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-hairline)]">
        <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
        <h2 className="title text-[var(--color-ink)]">FinPulse AI Configuration</h2>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="body-sm text-[var(--color-ink)] font-medium">Google Gemini API Key</p>
          <p className="caption text-[var(--color-ink-muted)] mt-0.5">
            Powers the AI Financial Copilot and automated health insights. Get a free key from{" "}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-primary)] hover:underline font-medium"
            >
              Google AI Studio
            </a>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setSaved(false);
              }}
              placeholder="AIzaSy... (or configured in .env)"
              className="w-full px-3.5 py-2 rounded-[var(--radius-xs)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] pr-9"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-primary-active)] transition-colors flex-shrink-0"
          >
            {saved ? "Saved" : "Save Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
