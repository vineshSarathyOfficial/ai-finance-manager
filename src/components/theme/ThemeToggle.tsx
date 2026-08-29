"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import type { Theme } from "@/lib/theme";

const OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

interface ThemeToggleProps {
  variant?: "segmented" | "icon";
  className?: string;
}

export function ThemeToggle({ variant = "segmented", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (variant === "icon") {
    const current = OPTIONS.find((o) => o.id === theme) ?? OPTIONS[2];
    const Icon = current.icon;
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className={cn(
          "w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)]",
          "text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors",
          className
        )}
        aria-label={`Theme: ${current.label}. Tap to switch.`}
        title={`Theme: ${current.label}`}
      >
        <Icon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex p-1 rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)]",
        className
      )}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTheme(id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-[14px] font-medium transition-colors min-h-[40px]",
            theme === id
              ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-level-1"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          )}
          aria-pressed={theme === id}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
