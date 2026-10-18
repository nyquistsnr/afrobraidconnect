import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader } from "@/components/ui/loader";

type ButtonVariant = "primary" | "outline";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  // Shows a spinner, disables the button and marks it aria-busy. Callers
  // that already render their own <Loader /> child can keep doing so.
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-brand-hover",
  outline:
    "border border-border bg-input text-foreground hover:bg-border/40",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", className = "", loading = false, disabled, children, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading && <Loader className="size-4" />}
        {children}
      </button>
    );
  }
);
