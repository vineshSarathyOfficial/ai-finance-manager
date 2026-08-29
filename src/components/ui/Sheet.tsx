"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-[var(--color-scrim)]/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "relative w-full sm:max-w-md bg-[var(--color-canvas)] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-md)]",
          "shadow-card max-h-[90dvh] overflow-y-auto safe-area-bottom",
          "animate-in slide-in-from-bottom duration-200",
          className
        )}
        role="dialog"
        aria-modal
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-hairline)] sticky top-0 bg-[var(--color-canvas)] z-10">
          {title && <h2 className="title-md text-[var(--color-ink)]">{title}</h2>}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onClose, title, description, children, footer }: DialogProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--color-scrim)]/50" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-md bg-[var(--color-canvas)] rounded-[var(--radius-md)] shadow-card"
        role="dialog"
        aria-modal
      >
        <div className="px-6 pt-6 pb-4">
          <h2 className="display-sm text-[var(--color-ink)]">{title}</h2>
          {description && (
            <p className="body-sm text-[var(--color-ink-muted)] mt-1">{description}</p>
          )}
        </div>
        <div className="px-6 pb-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--color-hairline)] flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <span className="sr-only">{description}</span>
    </Dialog>
  );
}
