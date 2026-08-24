import { TrendingUp } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas-soft)] flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] flex items-center justify-center">
          <TrendingUp className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-semibold text-[var(--color-ink)] text-lg tracking-tight">
          Finance Manager
        </span>
      </div>
      {children}
    </div>
  );
}
