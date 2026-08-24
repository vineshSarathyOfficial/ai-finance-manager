import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  brandName?: string;
}

export function Logo({
  className,
  size = "md",
  showText = true,
  brandName = "FinPulse",
}: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  const textSizes = {
    sm: "text-[14px]",
    md: "text-[16px]",
    lg: "text-[21px]",
  };

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* FinPulse Gradient Emblem with Financial Waveform */}
      <div
        className={cn(
          "relative rounded-[var(--radius-md)] flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0",
          iconSizes[size]
        )}
        style={{
          background: "linear-gradient(135deg, #0075DE 0%, #00B4D8 55%, #10B981 100%)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-[82%] h-[82%]">
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
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "font-bold text-[var(--color-ink)] tracking-tight",
              textSizes[size]
            )}
          >
            Fin<span className="text-[var(--color-primary)]">Pulse</span>
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded-[var(--radius-xs)] text-[10px] font-bold bg-gradient-to-r from-blue-600 to-emerald-500 text-white tracking-wider uppercase">
            AI
          </span>
        </div>
      )}
    </div>
  );
}
