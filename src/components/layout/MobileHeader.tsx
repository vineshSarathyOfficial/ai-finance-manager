"use client";

import { usePathname } from "next/navigation";
import { allNavItems } from "./navConfig";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/subscriptions": "Recurring",
  "/insights": "Insights",
  "/accounts": "Accounts",
  "/credit-cards": "Credit Cards",
  "/budgets": "Budgets",
  "/import": "Import",
  "/categories": "Categories",
  "/settings": "Settings",
};

export function MobileHeader({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname();

  const title =
    Object.entries(pageTitles).find(([path]) => pathname.startsWith(path))?.[1] ??
    allNavItems.find((item) => pathname.startsWith(item.href))?.label ??
    "FinPulse";

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[var(--color-canvas)]/95 backdrop-blur-sm border-b border-[var(--color-hairline)] safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="heading-sm text-[var(--color-ink)] truncate">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
