"use client";

import { useRef } from "react";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  label,
  error,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function distribute(cleaned: string) {
    const chars = cleaned.replace(/\D/g, "").slice(0, length);
    onChange(chars);
    const focusIndex = Math.min(chars.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  function setDigit(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");

    if (cleaned.length > 1) {
      distribute(cleaned);
      return;
    }

    const next = digits.slice();
    next[index] = cleaned;
    onChange(next.join(""));

    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted) return;
    event.preventDefault();
    distribute(pasted);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  return (
    <div>
      <div
        className="flex justify-between gap-2"
        role="group"
        aria-label={label}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            value={digit}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDigit(index, event.target.value)
            }
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-invalid={!!error}
            className={`h-14 w-full rounded-xl border bg-input text-center text-lg font-semibold text-foreground outline-none focus:border-brand sm:h-16 ${
              error ? "border-red-500" : "border-border"
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
