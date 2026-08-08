"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Globe, Search } from "lucide-react";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import * as Flags from "country-flag-icons/react/3x2";

interface CountryOption {
  value?: Country;
  label: string;
  divider?: boolean;
}

export interface CountrySelectProps {
  value?: Country;
  onChange: (value?: Country) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
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

export function CountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  name,
  searchPlaceholder = "Search country",
  noResultsLabel = "No countries found",
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectableOptions = useMemo(
    () => options.filter((option) => !option.divider),
    [options]
  );

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

  const selected = selectableOptions.find((option) => option.value === value);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        name={name}
        disabled={disabled || readOnly}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected?.label}
        className="flex items-center gap-1 py-0.5 pr-1 text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        <CountryFlag country={value} />
        <ChevronDown
          className={`size-3.5 text-icon-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <CountryDropdown
          options={selectableOptions}
          value={value}
          searchPlaceholder={searchPlaceholder}
          noResultsLabel={noResultsLabel}
          onSelect={(option) => {
            onChange(option.value);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// Mounted fresh each time the dropdown opens, so its search/highlight state
// starts clean without needing an effect to reset it.
function CountryDropdown({
  options,
  value,
  searchPlaceholder,
  noResultsLabel,
  onSelect,
  onClose,
}: {
  options: CountryOption[];
  value?: Country;
  searchPlaceholder: string;
  noResultsLabel: string;
  onSelect: (option: CountryOption) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) onSelect(option);
    }
  }

  return (
    <div
      role="listbox"
      className="absolute left-0 top-full z-10 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="size-4 shrink-0 text-icon-muted" />
        <input
          ref={(el) => el?.focus()}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
        />
      </div>
      <ul className="max-h-64 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filtered.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted-foreground">
            {noResultsLabel}
          </li>
        )}
        {filtered.map((option, index) => (
          <li key={option.value ?? "international"}>
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => onSelect(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
                index === activeIndex ? "bg-border/40" : ""
              } ${
                option.value === value
                  ? "font-semibold text-brand"
                  : "text-foreground"
              }`}
            >
              <CountryFlag country={option.value} />
              <span className="flex-1 truncate">{option.label}</span>
              {option.value && (
                <span className="text-xs text-muted-foreground">
                  +{getCountryCallingCode(option.value)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
