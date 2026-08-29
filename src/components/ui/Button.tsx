import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "utility" | "ghost" | "danger" | "on-dark";
type ButtonSize = "md" | "sm" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-active)] active:bg-[var(--color-primary-active)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-hairline)] shadow-level-1 hover:bg-[var(--color-canvas-soft)]",
  tertiary:
    "bg-transparent text-[var(--color-primary)] hover:underline underline-offset-2",
  utility:
    "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-hairline)] hover:bg-[var(--color-canvas-soft)] rounded-[var(--radius-md)] px-3.5 py-1",
  ghost:
    "bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-ink)]",
  danger:
    "bg-[var(--color-error-bg)] text-[var(--color-accent-orange-deep)] border border-[var(--color-hairline)] hover:bg-[var(--color-accent-orange)] hover:text-white",
  "on-dark":
    "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-active)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "h-10 px-5 button-md rounded-[var(--radius-full)]",
  sm: "h-9 px-4 button-sm rounded-[var(--radius-full)]",
  icon: "h-10 w-10 rounded-[var(--radius-full)] p-0 flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, children, ...props }, ref) => {
    const isPill = variant === "primary" || variant === "secondary" || variant === "on-dark";
    const isUtility = variant === "utility";

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-60",
          variantStyles[variant],
          isUtility && "button-sm",
          isPill && sizeStyles[size],
          !isPill && !isUtility && size !== "icon" && sizeStyles[size],
          size === "icon" && sizeStyles.icon,
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
