"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/actions/auth";
import { Sheet } from "@/components/ui/Sheet";
import { moreMenuItems } from "./navConfig";

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

export function MoreSheet({ open, onClose }: MoreSheetProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onClose={onClose} title="More">
      <nav className="space-y-1 -mt-2">
        {moreMenuItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-3.5 rounded-[var(--radius-sm)] transition-colors min-h-[48px]",
                active
                  ? "bg-[var(--color-primary-bg-subdued)] text-[var(--color-primary)]"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-surface-soft)]"
              )}
            >
              <Icon className="w-5 h-5 text-[var(--color-ink-muted)]" />
              <span className="body-md">{label}</span>
            </Link>
          );
        })}

        <form action={logoutUser} className="pt-2 border-t border-[var(--color-hairline)] mt-2">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-[var(--radius-sm)] body-md text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-soft)] min-h-[48px]"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </form>
      </nav>
    </Sheet>
  );
}
