"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AiCopilotContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const AiCopilotContext = createContext<AiCopilotContextValue | null>(null);

export function AiCopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <AiCopilotContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </AiCopilotContext.Provider>
  );
}

export function useAiCopilot() {
  const ctx = useContext(AiCopilotContext);
  if (!ctx) {
    throw new Error("useAiCopilot must be used within AiCopilotProvider");
  }
  return ctx;
}
