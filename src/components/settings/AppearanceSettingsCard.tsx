"use client";

import { Palette } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";

export function AppearanceSettingsCard() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-hairline)] shadow-level-1">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-hairline)]">
        <Palette className="w-4 h-4 text-[var(--color-ink-faint)]" />
        <h2 className="title text-[var(--color-ink)]">Appearance</h2>
      </div>
      <div className="px-5 py-4 space-y-3">
        <p className="body-sm text-[var(--color-ink-muted)]">
          Choose how FinPulse looks. Currently using {resolvedTheme} mode.
        </p>
        <ThemeToggle variant="segmented" className="w-full flex flex-wrap sm:flex-nowrap justify-stretch [&>button]:flex-1 [&>button]:justify-center [&>button_span]:hidden sm:[&>button_span]:inline" />
      </div>
    </div>
  );
}
