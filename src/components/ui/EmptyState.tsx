import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-[var(--radius-full)] bg-[var(--color-surface-soft)] flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[var(--color-ink-faint)]" />
      </div>
      <h3 className="title-md text-[var(--color-ink)] mb-1">{title}</h3>
      <p className="body-sm text-[var(--color-ink-muted)] max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <a href={action.href}>
            <Button>{action.label}</Button>
          </a>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      )}
      {children}
    </div>
  );
}
