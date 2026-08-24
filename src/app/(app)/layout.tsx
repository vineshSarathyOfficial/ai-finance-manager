import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { AiFloatingTrigger } from "@/components/ai/AiFloatingTrigger";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-canvas-soft)]">
      <Sidebar />
      <MobileNav />
      <main className="lg:pl-60 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Global AI Copilot Floating Button & Drawer */}
      <AiFloatingTrigger />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            border: "1px solid var(--color-hairline)",
            color: "var(--color-ink)",
            borderRadius: "var(--radius-xl)",
            fontSize: "15px",
          },
        }}
      />
    </div>
  );
}
