import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-strong)]",
        className
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface-card)] rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 py-4 border-b border-[var(--color-hairline)]">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-5 w-40 bg-[var(--color-surface-strong)] rounded-[var(--radius-sm)] hidden lg:block" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-48 sm:h-64 w-full rounded-[var(--radius-lg)]" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  );
}
