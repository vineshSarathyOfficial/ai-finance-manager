"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/actions/auth";
import { Logo } from "@/components/ui/Logo";
import { primaryNavItems, secondaryNavItems } from "./navConfig";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[var(--color-canvas)] border-r border-[var(--color-hairline)] fixed left-0 top-0 bottom-0 z-30">
      <div className="flex items-center px-4 h-16">
        <Link href="/dashboard" className="hover:opacity-90 transition-opacity">
          <Logo size="md" brandName="FinPulse" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {primaryNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] nav-link transition-colors",
                active
                  ? "bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)] font-medium"
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)]"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-ink-faint)]"
                )}
              />
              {label}
            </Link>
          );
        })}

        <div className="pt-4 pb-2">
          <p className="px-3 eyebrow text-[var(--color-ink-faint)]">More</p>
        </div>

        {secondaryNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] body-sm transition-colors",
                active
                  ? "bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)] font-medium"
                  : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0 text-[var(--color-ink-faint)]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-hairline)] px-3 py-4">
        <form action={logoutUser}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] body-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
