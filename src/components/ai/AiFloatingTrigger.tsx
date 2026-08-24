"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiAdvisorDrawer } from "./AiAdvisorDrawer";

export function AiFloatingTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="open-ai-copilot-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500 text-white font-medium text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        title="Open FinPulse AI Copilot"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="font-semibold tracking-tight">Ask FinPulse AI</span>
      </button>

      {/* Drawer */}
      <AiAdvisorDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
