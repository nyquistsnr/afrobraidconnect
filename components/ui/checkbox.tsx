import * as React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div className={`relative flex items-center ${className}`}>
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-md border border-border bg-surface transition-all checked:border-brand checked:bg-brand hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          ref={ref}
          {...props}
        />
        <Check className="pointer-events-none absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 text-brand-foreground opacity-0 transition-opacity peer-checked:opacity-100" />
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
