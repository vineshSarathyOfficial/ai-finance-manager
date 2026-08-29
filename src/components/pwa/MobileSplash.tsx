"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";

const SPLASH_STORAGE_KEY = "finpulse-splash-shown";
const VISIBLE_MS = 1200;
const FADE_MS = 400;
const MOBILE_MAX_WIDTH = 1023;

export function MobileSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const isMobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches;
    if (!isMobile || sessionStorage.getItem(SPLASH_STORAGE_KEY) === "1") return;

    setVisible(true);

    const fadeTimer = window.setTimeout(() => setFading(true), VISIBLE_MS);
    const hideTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_STORAGE_KEY, "1");
      setVisible(false);
    }, VISIBLE_MS + FADE_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="lg:hidden fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-canvas-soft)] transition-opacity duration-[400ms]"
      style={{ opacity: fading ? 0 : 1 }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4 animate-[splash-rise_0.6s_ease-out_both]">
        <Logo size="lg" brandName="FinPulse" />
        <p className="body-sm text-[var(--color-ink-muted)]">Your finances, in sync</p>
      </div>
    </div>
  );
}
