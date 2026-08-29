import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { AiCopilotProvider } from "@/components/ai/AiCopilotContext";
import { AiAdvisorDrawer } from "@/components/ai/AiAdvisorDrawer";
import { NavigationProvider } from "@/components/layout/NavigationProgress";
import { AddTransactionProvider } from "@/components/transactions/AddTransactionContext";
import { Toaster } from "sonner";
import { getRequiredUserId } from "@/lib/auth/session";
import { getCategories } from "@/lib/db/categories";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getRequiredUserId();
  const categories = await getCategories(userId);

  return (
    <AiCopilotProvider>
      <AddTransactionProvider categories={categories}>
        <NavigationProvider>
          <div className="min-h-dvh bg-[var(--color-canvas-soft)]">
            <Sidebar />
            <MobileHeader />
            <MobileNav />
            <main className="lg:pl-60 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(7.25rem+env(safe-area-inset-bottom,0px))] lg:pt-0 lg:pb-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-8">
                {children}
              </div>
            </main>

            <FloatingActions />
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
          </div>
        </NavigationProvider>
      </AddTransactionProvider>
    </AiCopilotProvider>
  );
}
