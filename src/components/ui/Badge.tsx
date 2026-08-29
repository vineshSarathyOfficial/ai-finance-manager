import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "muted"
  | "sky"
  | "purple"
  | "pink"
  | "orange"
  | "teal"
  | "green";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-surface)] text-[var(--color-ink-secondary)] border border-[var(--color-hairline)]",
  primary: "bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-hairline)]",
  success: "bg-[var(--color-accent-green-bg)] text-[var(--color-accent-green)]",
  warning: "bg-[var(--color-accent-orange-bg)] text-[var(--color-accent-orange-deep)]",
  error: "bg-[var(--color-accent-orange-bg)] text-[var(--color-accent-orange-deep)]",
  muted: "bg-[var(--color-canvas-soft)] text-[var(--color-ink-muted)]",
  sky: "bg-[var(--color-accent-sky-bg)] text-[var(--color-accent-sky)]",
  purple: "bg-[var(--color-accent-purple-bg)] text-[var(--color-accent-purple-deep)]",
  pink: "bg-[var(--color-accent-pink-bg)] text-[var(--color-accent-pink)]",
  orange: "bg-[var(--color-accent-orange-bg)] text-[var(--color-accent-orange-deep)]",
  teal: "bg-[var(--color-accent-teal-bg)] text-[var(--color-accent-teal)]",
  green: "bg-[var(--color-accent-green-bg)] text-[var(--color-accent-green)]",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-[var(--radius-full)] badge-text",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
