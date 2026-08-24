"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  UploadCloud,
  Tag,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",     label: "Home",    icon: LayoutDashboard },
  { href: "/transactions",  label: "Txns",   icon: ArrowLeftRight },
  { href: "/import",        label: "Import", icon: UploadCloud },
  { href: "/subscriptions", label: "Subs",   icon: RotateCcw },
  { href: "/analytics",     label: "Analyse",icon: BarChart3 },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-canvas)] border-t border-[var(--color-hairline)] safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-2.5 py-1.5 min-w-[54px]"
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-ink-faint)]"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-[var(--color-primary)]" : "text-[var(--color-ink-faint)]"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
