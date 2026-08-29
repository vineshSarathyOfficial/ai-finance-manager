"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavigationContextValue = {
  pendingHref: string | null;
  displayPath: string;
  markPending: (href: string) => void;
};

const NavigationContext = createContext<NavigationContextValue>({
  pendingHref: null,
  displayPath: "/",
  markPending: () => {},
});

function pathFromHref(href: string) {
  try {
    return new URL(href, "http://local").pathname;
  } catch {
    return href.split("?")[0] || href;
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const activePending = pendingHref && pendingHref !== pathname ? pendingHref : null;

  useEffect(() => {
    if (!activePending) return;
    const timer = window.setTimeout(() => setPendingHref(null), 8000);
    return () => window.clearTimeout(timer);
  }, [activePending]);

  const markPending = useCallback(
    (href: string) => {
      const next = pathFromHref(href);
      if (next === pathname) return;
      setPendingHref(next);
    },
    [pathname]
  );

  const value = useMemo(
    () => ({
      pendingHref: activePending,
      displayPath: activePending ?? pathname,
      markPending,
    }),
    [activePending, pathname, markPending]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed left-0 right-0 z-40 h-0.5 overflow-hidden lg:left-60",
          "top-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:top-0",
          !activePending && "opacity-0"
        )}
      >
        <div
          className={cn(
            "h-full w-1/3 rounded-full bg-[var(--color-primary)]",
            activePending && "animate-nav-indeterminate"
          )}
        />
      </div>
    </NavigationContext.Provider>
  );
}

export function useDisplayPath() {
  return useContext(NavigationContext).displayPath;
}

export function useMarkPending() {
  return useContext(NavigationContext).markPending;
}

export function usePendingHref() {
  return useContext(NavigationContext).pendingHref;
}
