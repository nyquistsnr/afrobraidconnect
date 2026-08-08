"use client";

import { useId } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  leading: React.ReactNode;
}

export function OptionPickerModal<T extends string>({
  open,
  onClose,
  title,
  description,
  closeLabel,
  options,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  options: PickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <ul role="listbox" className="mt-5 flex flex-col gap-2">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  onClose();
                }}
                className={`group flex w-full items-center gap-3.5 rounded-xl border p-3 text-left transition-all duration-150 ${
                  selected
                    ? "border-brand bg-brand/5 shadow-sm"
                    : "border-transparent hover:border-border hover:bg-border/30"
                }`}
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                    selected
                      ? "bg-brand text-brand-foreground"
                      : "bg-border/50 text-foreground group-hover:bg-border"
                  }`}
                >
                  {option.leading}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </span>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    selected
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border text-transparent"
                  }`}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
