import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  featured?: boolean;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className, hover, padding = "md", featured, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border",
        featured
          ? "bg-[var(--color-secondary)] text-[var(--color-on-primary)] border-transparent shadow-level-2"
          : "bg-[var(--color-surface-card)] text-[var(--color-ink)] border-[var(--color-hairline)]",
        paddingMap[padding],
        hover && !featured && "transition-shadow hover:shadow-level-1 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("heading-sm text-inherit", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("body-sm text-[var(--color-ink-muted)] mt-0.5", className)}>{children}</p>;
}
