import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  const hasMobileContent = Boolean(description || action);

  return (
    <div
      className={cn(
        "flex flex-row items-start justify-between gap-3",
        !hasMobileContent && "hidden lg:flex",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="display-md text-[var(--color-ink)] hidden lg:block">{title}</h1>
        {description && (
          <p className="body-sm text-[var(--color-ink-muted)] lg:mt-1 truncate">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0 self-start">{action}</div>}
    </div>
  );
}
