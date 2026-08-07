"use client";

import { useId, useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface ComboboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  showLabel?: boolean;
  options: string[];
  error?: string;
}

export function ComboboxInput({
  label,
  showLabel = false,
  options,
  error,
  value,
  onChange,
  id,
  className = "",
  ...props
}: ComboboxInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const query = String(value ?? "").toLowerCase();
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(query)
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={inputId}
        className={
          showLabel
            ? "mb-1.5 block text-sm font-medium text-foreground"
            : "sr-only"
        }
      >
        {label}
      </label>
      <div
        className={`relative flex items-center gap-3 border bg-input px-4 py-3 focus-within:border-brand ${
          error ? "border-red-500" : "border-border"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={(e) => {
            onChange?.(e);
            setOpen(true);
          }}
          onFocus={(e) => {
            setOpen(true);
            e.target.select();
          }}
          className={`w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          className="-mr-2 flex size-6 shrink-0 items-center justify-center rounded-sm text-icon-muted hover:bg-border/50"
        >
          <ChevronDown
            className={`size-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {open && filteredOptions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto border border-border bg-surface py-1 shadow-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredOptions.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                className="flex w-full items-center px-4 py-2 text-left text-sm text-foreground hover:bg-border/40"
                onMouseDown={(e) => {
                  // Use mousedown to prevent input blur before click
                  e.preventDefault();
                  // Simulate an event for the onChange handler
                  const syntheticEvent = {
                    target: { value: opt },
                    currentTarget: { value: opt },
                  } as unknown as React.ChangeEvent<HTMLInputElement>;
                  onChange?.(syntheticEvent);
                  setOpen(false);
                }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
