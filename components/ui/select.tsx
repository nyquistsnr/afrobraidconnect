"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

export interface SelectProps<T extends string> {
  label: string;
  showLabel?: boolean;
  value: T | "";
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  error?: string;
  id?: string;
}

export function Select<T extends string>({
  label,
  showLabel = false,
  value,
  onChange,
  options,
  placeholder,
  error,
  id,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id ?? generatedId;

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

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") setOpen(false);
    else if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  const selected = options.find((option) => option.value === value);
  const SelectedIcon = selected?.icon;

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={selectId}
        className={
          showLabel
            ? "mb-1.5 block text-sm font-medium text-foreground"
            : "sr-only"
        }
      >
        {label}
      </label>

      <button
        type="button"
        id={selectId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl border bg-input px-4 py-3 text-left text-sm outline-none focus:border-brand ${
          error ? "border-red-500" : "border-border"
        }`}
      >
        {SelectedIcon && (
          <SelectedIcon className="size-5 shrink-0 text-icon-muted" />
        )}
        <span
          className={`flex-1 truncate ${
            selected ? "text-foreground" : "text-placeholder"
          }`}
        >
          {selected?.label ?? placeholder ?? label}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-icon-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-border/40 ${
                    option.value === value
                      ? "font-semibold text-brand"
                      : "text-foreground"
                  }`}
                >
                  {Icon && <Icon className="size-4 shrink-0" />}
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.value === value && (
                    <Check className="size-4 shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
