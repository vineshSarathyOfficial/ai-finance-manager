"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { useMarkPending, usePendingHref } from "./NavigationProgress";
import { cn } from "@/lib/utils";

type AppNavLinkProps = Omit<ComponentProps<typeof Link>, "href" | "children"> & {
  href: string;
  children: ReactNode | ((active: boolean) => ReactNode);
};

export function AppNavLink({ href, children, className, onClick, prefetch, ...props }: AppNavLinkProps) {
  const pathname = usePathname();
  const pendingHref = usePendingHref();
  const markPending = useMarkPending();
  const active = (pendingHref ?? pathname).startsWith(href);

  return (
    <Link
      href={href}
      prefetch={prefetch ?? true}
      className={cn(className)}
      onClick={(event) => {
        markPending(href);
        onClick?.(event);
      }}
      {...props}
    >
      {typeof children === "function" ? children(active) : children}
    </Link>
  );
}
