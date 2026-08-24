import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas-soft)] flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo size="lg" brandName="FinPulse" />
      </div>
      {children}
    </div>
  );
}
