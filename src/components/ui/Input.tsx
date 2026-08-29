import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="caption text-[var(--color-ink-muted)] block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full min-h-10 px-1.5 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)]",
            "bg-[var(--color-canvas)] text-[var(--color-ink)] body-md",
            "placeholder:text-[var(--color-ink-faint)]",
            "focus:outline-none focus:border-[var(--color-primary)]",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-[var(--color-error)]",
            className
          )}
          {...props}
        />
        {error && <p className="caption-sm text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="caption text-[var(--color-ink-muted)] block">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full min-h-10 px-1.5 py-1.5 rounded-[var(--radius-xs)] border border-[var(--color-hairline-input)]",
            "bg-[var(--color-canvas)] text-[var(--color-ink)] body-sm",
            "focus:outline-none focus:border-[var(--color-primary)]",
            "transition-colors",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";
