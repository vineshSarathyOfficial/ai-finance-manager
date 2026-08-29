import { StatCardSkeleton } from "@/components/ui/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-4 lg:space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[var(--color-surface-strong)] rounded-[var(--radius-sm)]" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="h-64 bg-[var(--color-surface-strong)] rounded-[var(--radius-md)]" />
    </div>
  );
}
