"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Loader2, Key, HelpCircle, ChevronRight, RefreshCcw } from "lucide-react";
import { askFinancialCopilotAction, type ChatMessage } from "@/actions/ai";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTED_PROMPTS = [
  "How much did I spend this month vs last month?",
  "Where can I cut expenses to save ₹10,000?",
  "Audit my active subscriptions & recurring bills",
  "What is my highest spending category this month?",
];

export function AiAdvisorDrawer({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content:
        "👋 Hello! I am your **FinPulse AI Copilot**. I have access to your live financial dashboard, recent transactions, categories, and subscriptions.\n\nAsk me anything about your spending, or tap a suggestion below!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyMissingError, setKeyMissingError] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("finpulse_gemini_api_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  function handleSaveKey(newKey: string) {
    setApiKey(newKey);
    localStorage.setItem("finpulse_gemini_api_key", newKey);
    setShowKeyInput(false);
    setKeyMissingError(false);
  }

  function handleSend(promptText?: string) {
    const textToSend = promptText || input.trim();
    if (!textToSend || isPending) return;

    const newHistory: ChatMessage[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newHistory);
    if (!promptText) setInput("");

    startTransition(async () => {
      const result = await askFinancialCopilotAction(textToSend, newHistory, apiKey || undefined);

      if (result.success) {
        setMessages((prev) => [...prev, { role: "model", content: result.response }]);
        setKeyMissingError(false);
      } else if (result.error === "GEMINI_KEY_MISSING") {
        setKeyMissingError(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content:
              "⚠️ **Gemini API Key Required**\n\nTo chat with your financial data, please enter your free Gemini API key below (or set `GEMINI_API_KEY` in your `.env` file).",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: `❌ **Error:** ${result.error || "Failed to process your query."}`,
          },
        ]);
      }
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--color-surface)] border-l border-[var(--color-hairline)] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-hairline)] bg-[var(--color-canvas)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="title text-[var(--color-ink)] text-base">FinPulse AI</h2>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-[var(--color-primary)] border border-blue-200 uppercase">
                    Copilot
                  </span>
                </div>
                <p className="caption text-[var(--color-ink-muted)] text-xs">
                  Live Financial Advisor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas-soft)] transition-colors"
                title="Configure Gemini API Key"
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-canvas-soft)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Optional API Key Input Banner */}
          {(showKeyInput || keyMissingError) && (
            <div className="p-4 bg-blue-50/70 border-b border-blue-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="body-sm font-semibold text-blue-950">Enter Gemini API Key</p>
                  <p className="caption text-blue-800 mt-0.5">
                    Free from{" "}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium hover:text-blue-900"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowKeyInput(false);
                    setKeyMissingError(false);
                  }}
                  className="text-blue-700 hover:text-blue-950 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-3 py-1.5 rounded-[var(--radius-sm)] border border-blue-300 bg-white text-xs text-[var(--color-ink)] focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleSaveKey(apiKey)}
                  className="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white text-xs font-medium hover:bg-[var(--color-primary-active)] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[var(--color-primary)] border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-[var(--radius-lg)] p-3.5 body-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--color-primary)] text-white"
                      : "bg-[var(--color-canvas)] border border-[var(--color-hairline)] text-[var(--color-ink)] whitespace-pre-wrap shadow-xs"
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-[var(--color-canvas-soft)] text-[var(--color-ink)] border border-[var(--color-hairline)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-50 text-[var(--color-primary)] border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline)] rounded-[var(--radius-lg)] p-3.5 flex items-center gap-2 text-[var(--color-ink-muted)] caption shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                  <span>Analyzing financial data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts */}
          {messages.length <= 2 && (
            <div className="p-3 border-t border-[var(--color-hairline)] bg-[var(--color-canvas)]/50 space-y-1.5">
              <p className="caption text-[var(--color-ink-muted)] font-medium px-1">
                Suggested Questions:
              </p>
              <div className="flex flex-col gap-1">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    disabled={isPending}
                    className="text-left px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-hairline)] bg-[var(--color-surface)] text-xs text-[var(--color-ink-secondary)] hover:bg-[var(--color-canvas-soft)] hover:text-[var(--color-ink)] transition-colors flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-ink-faint)] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-4 border-t border-[var(--color-hairline)] bg-[var(--color-surface)]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="ai-copilot-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about spending, budgets, savings..."
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-[var(--radius-full)] border border-[var(--color-hairline)] bg-[var(--color-canvas-soft)] text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isPending}
                className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-active)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
