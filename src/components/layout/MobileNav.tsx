"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { mobileTabItems } from "./navConfig";
import { MoreSheet } from "./MoreSheet";
import { useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-canvas)]/95 backdrop-blur-sm border-t border-[var(--color-hairline)] safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {mobileTabItems.map(({ href, mobileLabel, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 py-2 min-w-[56px] min-h-[48px] justify-center"
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    active ? "text-[var(--color-primary)]" : "text-[var(--color-ink-faint)]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-[var(--color-primary)]" : "text-[var(--color-ink-faint)]"
                  )}
                >
                  {mobileLabel}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-2 min-w-[56px] min-h-[48px] justify-center"
          >
            <MoreHorizontal
              className={cn(
                "w-5 h-5",
                moreOpen || secondaryActive(pathname)
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-ink-faint)]"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                moreOpen || secondaryActive(pathname)
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-ink-faint)]"
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

function secondaryActive(pathname: string) {
  const secondaryPaths = [
    "/insights", "/accounts", "/credit-cards", "/budgets",
    "/import", "/categories", "/settings",
  ];
  return secondaryPaths.some((p) => pathname.startsWith(p));
}
