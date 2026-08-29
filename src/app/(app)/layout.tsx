import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { AiCopilotProvider } from "@/components/ai/AiCopilotContext";
import { AiCopilotTrigger } from "@/components/ai/AiCopilotTrigger";
import { AiAdvisorDrawer } from "@/components/ai/AiAdvisorDrawer";
import { AddTransactionFab } from "@/components/transactions/AddTransactionFab";
import { NavigationProvider } from "@/components/layout/NavigationProgress";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AiCopilotProvider>
      <NavigationProvider>
        <div className="min-h-dvh bg-[var(--color-canvas-soft)]">
          <Sidebar />
          <MobileHeader />
          <MobileNav />
          <main className="lg:pl-60 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pt-0 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-8">
              {children}
            </div>
          </main>

          <AddTransactionFab />
          <AiCopilotTrigger />
          <AiAdvisorDrawer />

          <Toaster
            position="top-center"
            offset={{ top: 72 }}
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
          <ServiceWorkerRegistration />
        </div>
      </NavigationProvider>
    </AiCopilotProvider>
  );
}
