import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AiCopilotProvider } from "@/components/ai/AiCopilotContext";
import { AiCopilotTrigger } from "@/components/ai/AiCopilotTrigger";
import { AiAdvisorDrawer } from "@/components/ai/AiAdvisorDrawer";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AiCopilotProvider>
      <div className="min-h-screen bg-[var(--color-canvas-soft)]">
        <Sidebar />
        <MobileHeader />
        <MobileNav />
        <main className="lg:pl-60 pb-24 lg:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
            {children}
          </div>
        </main>

        <AiCopilotTrigger />
        <AiAdvisorDrawer />

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              border: "1px solid var(--color-hairline)",
              color: "var(--color-ink)",
              borderRadius: "var(--radius-md)",
              fontSize: "14px",
            },
          }}
        />
      </div>
    </AiCopilotProvider>
  );
}
