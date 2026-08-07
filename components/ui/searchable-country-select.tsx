"use client";

import { useEffect, useMemo, useRef, useState, useId } from "react";
import { Check, ChevronDown, Globe, Search } from "lucide-react";
import { type Country } from "react-phone-number-input";
import * as Flags from "country-flag-icons/react/3x2";
import enNames from "react-phone-number-input/locale/en";

// Define EU countries + UK & US
const EU_COUNTRIES: Country[] = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", 
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", 
  "SI", "ES", "SE"
];

export interface CountryOption {
  value: Country;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface SearchableCountrySelectProps {
  label: string;
  value: Country | "";
  onChange: (value: Country) => void;
  error?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;
}

function CountryFlag({ country }: { country?: Country }) {
  if (!country) return <Globe className="size-4 shrink-0 text-icon-muted" />;
  const Flag = (
    Flags as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>
  )[country];
  if (!Flag) return <Globe className="size-4 shrink-0 text-icon-muted" />;
  return <Flag className="h-3.5 w-5 shrink-0" />;
}

export function SearchableCountrySelect({
  label,
  value,
  onChange,
  error,
  placeholder = "Select a country",
  searchPlaceholder = "Search...",
  noResultsLabel = "No countries found",
}: SearchableCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();

  const options: CountryOption[] = useMemo(() => {
    const list: CountryOption[] = EU_COUNTRIES.map((c) => ({
      value: c,
      label: enNames[c],
    })).sort((a, b) => a.label.localeCompare(b.label));

    list.push({
      value: "GB",
      label: enNames["GB"],
      disabled: true,
      disabledReason: "Available in 4 months",
    });
    list.push({
      value: "US",
      label: enNames["US"],
      disabled: true,
      disabledReason: "Coming soon",
    });
    return list;
  }, []);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    
    // Focus search input when opened
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

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
    else if (!open && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setOpen(true);
    }
  }

  const selected = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={generatedId}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
      </label>

      <button
        type="button"
        id={generatedId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 border bg-input px-4 py-3 text-left text-sm outline-none focus:border-brand ${
          error ? "border-red-500" : "border-border"
        }`}
      >
        <CountryFlag country={selected?.value} />
        <span
          className={`flex-1 truncate ${
            selected ? "text-foreground" : "text-placeholder"
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-icon-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 border border-border bg-surface shadow-lg">
          <div className="flex items-center gap-2 border-b border-border p-2">
            <Search className="size-4 shrink-0 text-icon-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>
          
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-muted-foreground">
                {noResultsLabel}
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setOpen(false);
                      }
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                      option.disabled
                        ? "cursor-not-allowed opacity-50"
                        : "hover:bg-border/40"
                    } ${
                      option.value === value
                        ? "font-semibold text-brand bg-brand/5"
                        : "text-foreground"
                    }`}
                  >
                    <CountryFlag country={option.value} />
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{option.label}</span>
                      {option.disabled && option.disabledReason && (
                        <span className="ml-2 shrink-0 text-xs text-muted-foreground italic">
                          {option.disabledReason}
                        </span>
                      )}
                    </div>
                    {!option.disabled && option.value === value && (
                      <Check className="size-4 shrink-0" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
