"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, MapPin, Star, Car, X } from "lucide-react";
import { RADIUS_PRESETS_KM, type SearchFilters } from "@/lib/search-query";
import { formatTemplate } from "@/lib/format-template";
import type { SearchPatch } from "@/components/search-results/search-results-view";
import type { SearchResultsDict } from "@/components/search-results/types";

const MIN_RATING = 4.5;

function Chip({
  active,
  onClick,
  children,
  ariaExpanded,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaExpanded === undefined ? active : undefined}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-all active:scale-[0.97] ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-foreground hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}

// Anchored dropdown for a chip. Rendered with `fixed` positioning from the
// chip's rect so it isn't clipped by the horizontally scrolling chip row.
function ChipPopover({
  label,
  active,
  icon,
  children,
}: {
  label: string;
  active: boolean;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onResize() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  function toggle() {
    if (!open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const width = 288;
      setPos({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
      });
    }
    setOpen((v) => !v);
  }

  return (
    <div ref={anchorRef} className="shrink-0">
      <Chip active={active} onClick={toggle} ariaExpanded={open}>
        {icon}
        {label}
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </Chip>
      {open && pos && (
        <div
          ref={panelRef}
          style={{ top: pos.top, left: pos.left }}
          className="search-panel-in fixed z-50 w-72 rounded-2xl border border-border bg-surface p-4 shadow-xl"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function PriceForm({
  filters,
  onApply,
  dict,
}: {
  filters: SearchFilters;
  onApply: (min?: number, max?: number) => void;
  dict: SearchResultsDict;
}) {
  const [min, setMin] = useState(filters.minPrice ? String(filters.minPrice) : "");
  const [max, setMax] = useState(filters.maxPrice ? String(filters.maxPrice) : "");
  const presets: { label: string; min?: number; max?: number }[] = [
    { label: formatTemplate(dict.priceUnder, { max: 50 }), max: 50 },
    { label: formatTemplate(dict.priceBetween, { min: 50, max: 100 }), min: 50, max: 100 },
    { label: formatTemplate(dict.priceOver, { min: 100 }), min: 100 },
  ];

  function parse(value: string) {
    const num = Number(value);
    return value && Number.isFinite(num) && num > 0 ? num : undefined;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        let lo = parse(min);
        let hi = parse(max);
        if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];
        onApply(lo, hi);
      }}
      className="flex flex-col gap-4"
    >
      <p className="text-sm font-semibold text-foreground">{dict.priceHeading}</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const selected = filters.minPrice === preset.min && filters.maxPrice === preset.max;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onApply(preset.min, preset.max)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground/40"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        {(
          [
            [dict.priceMin, min, setMin],
            [dict.priceMax, max, setMax],
          ] as const
        ).map(([label, value, setValue]) => (
          <label
            key={label}
            className="flex flex-1 flex-col rounded-xl border border-border px-3 py-1.5 focus-within:border-foreground"
          >
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="flex items-center gap-1 text-sm text-foreground">
              €
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="w-full bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onApply(undefined, undefined)}
          className="text-sm font-semibold text-foreground underline underline-offset-2"
        >
          {dict.clear}
        </button>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          {dict.apply}
        </button>
      </div>
    </form>
  );
}

function priceLabel(filters: SearchFilters, dict: SearchResultsDict): string {
  const { minPrice: min, maxPrice: max } = filters;
  if (min != null && max != null) return formatTemplate(dict.priceBetween, { min, max });
  if (max != null) return formatTemplate(dict.priceUnder, { max });
  if (min != null) return formatTemplate(dict.priceOver, { min });
  return dict.filterPrice;
}

export function SearchFiltersBar({
  hasCoords,
  radiusKm,
  filters,
  onUpdateSearch,
  dict,
}: {
  hasCoords: boolean;
  radiusKm: number;
  filters: SearchFilters;
  onUpdateSearch: (patch: SearchPatch) => void;
  dict: SearchResultsDict;
}) {
  const hasPrice = filters.minPrice != null || filters.maxPrice != null;
  const activeCount =
    (hasPrice ? 1 : 0) + (filters.minRating ? 1 : 0) + (filters.mobileOnly ? 1 : 0);

  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {hasCoords && (
        <ChipPopover
          label={formatTemplate(dict.distanceOption, { radius: radiusKm })}
          active={false}
          icon={<MapPin className="size-3.5" />}
        >
          {(close) => (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-foreground">{dict.distanceHeading}</p>
              <div className="flex flex-col">
                {RADIUS_PRESETS_KM.map((radius) => (
                  <button
                    key={radius}
                    type="button"
                    onClick={() => {
                      close();
                      if (radius !== radiusKm) onUpdateSearch({ radius_km: String(radius) });
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-border/40"
                  >
                    {formatTemplate(dict.withinRadiusOption, { radius })}
                    {radius === radiusKm && <Check className="size-4 text-brand" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </ChipPopover>
      )}

      <ChipPopover label={priceLabel(filters, dict)} active={hasPrice}>
        {(close) => (
          <PriceForm
            filters={filters}
            dict={dict}
            onApply={(min, max) => {
              close();
              onUpdateSearch({
                min_price: min != null ? String(min) : null,
                max_price: max != null ? String(max) : null,
              });
            }}
          />
        )}
      </ChipPopover>

      <Chip
        active={!!filters.minRating}
        onClick={() =>
          onUpdateSearch({ min_rating: filters.minRating ? null : String(MIN_RATING) })
        }
      >
        <Star className={`size-3.5 ${filters.minRating ? "fill-current" : ""}`} />
        {formatTemplate(dict.filterRating, { rating: MIN_RATING })}
      </Chip>

      <Chip
        active={!!filters.mobileOnly}
        onClick={() => onUpdateSearch({ mobile: filters.mobileOnly ? null : "1" })}
      >
        <Car className="size-3.5" />
        {dict.filterMobile}
      </Chip>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() =>
            onUpdateSearch({ min_price: null, max_price: null, min_rating: null, mobile: null })
          }
          className="flex shrink-0 items-center gap-1 px-2 py-2 text-sm font-semibold whitespace-nowrap text-foreground underline underline-offset-2"
        >
          <X className="size-3.5" />
          {dict.clearFilters}
        </button>
      )}
    </div>
  );
}
