import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  brandName?: string;
  variant?: "light" | "dark";
}

export function Logo({
  className,
  size = "md",
  showText = true,
  brandName = "FinPulse",
  variant = "light",
}: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  const textSizes = {
    sm: "text-[15px]",
    md: "text-[16px]",
    lg: "text-[20px]",
  };

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div
        className={cn(
          "relative rounded-[var(--radius-md)] flex items-center justify-center overflow-hidden flex-shrink-0 bg-[var(--color-primary)]",
          iconSizes[size]
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-[78%] h-[78%]">
          <path
            d="M3 12H7L9.5 6.5L13.5 17.5L16.5 9.5L18.5 12H21"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16.5" cy="9.5" r="1.5" fill="white" />
        </svg>
      </div>

      {showText && (
        <span
          className={cn(
            "font-semibold tracking-tight",
            textSizes[size],
            variant === "dark" ? "text-white" : "text-[var(--color-ink)]"
          )}
        >
          {brandName.split(/(Pulse)/).map((part, i) =>
            part === "Pulse" ? (
              <span key={i} className="text-[var(--color-primary)]">
                {part}
              </span>
            ) : (
              part
            )
          )}
        </span>
      )}
    </div>
  );
}
