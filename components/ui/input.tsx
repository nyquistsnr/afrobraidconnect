import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  showLabel?: boolean;
  icon?: LucideIcon;
  trailing?: ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, showLabel = false, icon: Icon, trailing, error, id, className = "", ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={inputId} className={showLabel ? "mb-1.5 block text-sm font-medium text-foreground" : "sr-only"}>
        {label}
      </label>
      <div
        className={`flex items-center gap-3 border bg-input px-4 py-3 focus-within:border-brand ${
          error ? "border-red-500" : "border-border"
        }`}
      >
        {Icon && <Icon aria-hidden className="size-5 shrink-0 text-icon-muted" />}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {trailing}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});
