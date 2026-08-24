"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  UploadCloud,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/actions/auth";
import { Logo } from "@/components/ui/Logo";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/transactions",  label: "Transactions",  icon: ArrowLeftRight },
  { href: "/import",        label: "Import Statement", icon: UploadCloud },
  { href: "/subscriptions", label: "Subscriptions", icon: RotateCcw },
  { href: "/categories",    label: "Categories",    icon: Tag },
  { href: "/analytics",     label: "Analytics",     icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[var(--color-canvas)] border-r border-[var(--color-hairline)] fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center px-5 h-16 border-b border-[var(--color-hairline)]">
        <Link href="/dashboard" className="hover:opacity-90 transition-opacity">
          <Logo size="md" brandName="FinPulse" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-[15px] transition-colors",
                active
                  ? "bg-[var(--color-canvas-soft)] text-[var(--color-primary)] font-medium"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)]"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-ink-faint)]"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--color-hairline)] px-3 py-4 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-[15px] transition-colors",
            pathname.startsWith("/settings")
              ? "bg-[var(--color-canvas-soft)] text-[var(--color-primary)] font-medium"
              : "text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)]"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0 text-[var(--color-ink-faint)]" />
          Settings
        </Link>
        <form action={logoutUser}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-[15px] text-[var(--color-ink-muted)] hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)] transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-[var(--color-ink-faint)]" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
