"use client";

import { usePathname } from "next/navigation";
import { getPageTitle } from "./navConfig";
import { useDisplayPath } from "./NavigationProgress";

export function MobileHeader({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname();
  const displayPath = useDisplayPath();
  const title = getPageTitle(displayPath || pathname);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[var(--color-canvas)]/95 backdrop-blur-sm border-b border-[var(--color-hairline)] safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="heading-sm text-[var(--color-ink)] truncate">{title}</h1>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
