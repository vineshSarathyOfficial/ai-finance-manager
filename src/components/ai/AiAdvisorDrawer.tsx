"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Sparkles,
  Send,
  X,
  Key,
  RotateCcw,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { askFinancialCopilotAction, type ChatMessage } from "@/actions/ai";
import { useAiCopilot } from "./AiCopilotContext";
import { AiMessageContent } from "./AiMessageContent";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  { label: "Month vs month", prompt: "How much did I spend this month vs last month?" },
  { label: "Cut expenses", prompt: "Where can I cut expenses to save ₹10,000?" },
  { label: "Subscriptions", prompt: "Audit my active subscriptions & recurring bills" },
  { label: "Top category", prompt: "What is my highest spending category this month?" },
];

const WELCOME_MESSAGE: ChatMessage = {
  role: "model",
  content:
    "Hi — I'm **FinPulse AI**. I can read your transactions, categories, and recurring bills to answer questions about spending, savings, and budgets.\n\nPick a suggestion below or type your own question.",
};

const STICKER_DOTS = [
  "bg-[var(--color-accent-sky)]",
  "bg-[var(--color-accent-purple)]",
  "bg-[var(--color-accent-pink)]",
  "bg-[var(--color-accent-teal)]",
];

export function AiAdvisorDrawer() {
  const { isOpen, close } = useAiCopilot();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [keyMissingError, setKeyMissingError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("finpulse_gemini_api_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  function handleSaveKey(newKey: string) {
    setApiKey(newKey);
    localStorage.setItem("finpulse_gemini_api_key", newKey);
    setShowKeyPanel(false);
    setKeyMissingError(false);
  }

  function handleNewChat() {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
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
        setShowKeyPanel(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content:
              "**API key needed** — Add your free Gemini key to chat with your data. Tap the key icon above, or set `GEMINI_API_KEY` in your `.env` file.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: `**Something went wrong:** ${result.error || "Please try again."}` },
        ]);
      }
    });
  }

  const showSuggestions = messages.length <= 1 && !isPending;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={close}
        aria-hidden
      />

      <div
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-[var(--color-canvas-soft)]",
          "border-l border-[var(--color-hairline)] shadow-level-2",
          "animate-in slide-in-from-right duration-200"
        )}
        role="dialog"
        aria-modal
        aria-labelledby="ai-copilot-title"
      >
        {/* Hero header — Notion night band */}
        <div className="relative overflow-hidden bg-[var(--color-secondary)] text-[var(--color-on-primary)] px-4 sm:px-5 pt-4 sm:pt-5 pb-5 sm:pb-6 flex-shrink-0 safe-area-top">
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {STICKER_DOTS.map((color, i) => (
              <span
                key={i}
                className={cn("absolute rounded-full w-2 h-2", color)}
                style={{
                  top: `${12 + i * 18}%`,
                  right: `${8 + i * 12}%`,
                }}
              />
            ))}
          </div>

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-white/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="eyebrow text-white/70 mb-1">FinPulse</p>
                <h2 id="ai-copilot-title" className="heading-3 text-white truncate">
                  Ask AI
                </h2>
                <p className="caption text-white/75 mt-1">
                  Answers from your live financial data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-0.5 flex-shrink-0">
              <HeaderIconButton
                onClick={() => setShowKeyPanel((v) => !v)}
                label="API key"
                active={showKeyPanel || keyMissingError}
              >
                <Key className="w-4 h-4" />
              </HeaderIconButton>
              <HeaderIconButton onClick={handleNewChat} label="New chat">
                <RotateCcw className="w-4 h-4" />
              </HeaderIconButton>
              <HeaderIconButton onClick={close} label="Close">
                <X className="w-5 h-5" />
              </HeaderIconButton>
            </div>
          </div>
        </div>

        {/* API key panel */}
        {(showKeyPanel || keyMissingError) && (
          <div className="flex-shrink-0 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-hairline)]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="body-sm font-medium text-[var(--color-ink)]">Gemini API key</p>
                <p className="caption text-[var(--color-ink-muted)] mt-0.5">
                  Free from{" "}
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--color-primary)] inline-flex items-center gap-0.5 hover:underline"
                  >
                    Google AI Studio
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowKeyPanel(false);
                  setKeyMissingError(false);
                }}
                className="p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] bg-[var(--color-surface)] body-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)] shadow-level-1"
              />
              <button
                type="button"
                onClick={() => handleSaveKey(apiKey)}
                className="px-4 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] button-sm hover:bg-[var(--color-primary-active)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
          {messages.map((msg, idx) => (
            <MessageRow key={idx} message={msg} />
          ))}

          {isPending && <TypingIndicator />}

          {showSuggestions && (
            <div className="pt-2">
              <p className="eyebrow text-[var(--color-ink-faint)] mb-2">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map(({ label, prompt }) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] bg-[var(--color-surface)] border border-[var(--color-hairline)] text-[var(--color-primary)] badge-text hover:bg-[var(--color-canvas)] hover:shadow-level-1 transition-all group"
                  >
                    {label}
                    <ChevronRight className="w-3 h-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="flex-shrink-0 p-4 bg-[var(--color-surface)] border-t border-[var(--color-hairline)] safe-area-bottom">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              id="ai-copilot-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about spending, budgets, savings…"
              disabled={isPending}
              className="flex-1 min-h-[44px] max-h-32 px-3 py-2.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)] bg-[var(--color-canvas-soft)] body-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:shadow-level-1 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isPending}
              className="h-11 w-11 flex-shrink-0 rounded-[var(--radius-full)] bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center hover:bg-[var(--color-primary-active)] active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-level-1"
              aria-label="Send message"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <p className="caption text-[var(--color-ink-faint)] text-center mt-2">
            AI can make mistakes — verify important numbers.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeaderIconButton({
  children,
  onClick,
  label,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "p-2 rounded-[var(--radius-sm)] text-white/80 hover:text-white hover:bg-white/10 transition-colors",
        active && "bg-white/15 text-white"
      )}
    >
      {children}
    </button>
  );
}

function MessageRow({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-purple-bg)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-[var(--color-accent-purple-deep)]" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[88%] rounded-[var(--radius-lg)] px-4 py-3",
          isUser
            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
            : "bg-[var(--color-surface)] border border-[var(--color-hairline)] text-[var(--color-ink)] shadow-level-1"
        )}
      >
        {isUser ? (
          <p className="body-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <AiMessageContent content={message.content} />
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-purple-bg)] flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-[var(--color-accent-purple-deep)]" />
      </div>
      <div className="bg-[var(--color-surface)] border border-[var(--color-hairline)] rounded-[var(--radius-lg)] px-4 py-3 flex items-center gap-2 shadow-level-1">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
        <span className="caption text-[var(--color-ink-muted)]">Thinking…</span>
      </div>
    </div>
  );
}
