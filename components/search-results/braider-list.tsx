"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, RotateCw, SearchX } from "lucide-react";
import type { BraiderSearchItem, PaginationMeta } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import {
  MAX_RADIUS_KM,
  RADIUS_PRESETS_KM,
  type SearchFilters,
  type SearchLinkContext,
} from "@/lib/search-query";
import { formatTemplate } from "@/lib/format-template";
import { BraiderCard } from "@/components/search-results/braider-card";
import { PaginationControl } from "@/components/search-results/pagination-control";
import { SearchFiltersBar } from "@/components/search-results/search-filters";
import type { SearchPatch } from "@/components/search-results/search-results-view";
import type { SearchResultsDict } from "@/components/search-results/types";

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 p-3">
      <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-border/50" />
      <div className="flex flex-col gap-2 px-1 pb-1">
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-border/60" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-border/40" />
        <div className="h-3.5 w-1/4 animate-pulse rounded bg-border/60" />
      </div>
    </div>
  );
}

export function BraiderList({
  items,
  pagination,
  hasError,
  isLoading,
  isUpdating,
  onRetry,
  locationLabel,
  hasCoords,
  radiusKm,
  filters,
  onUpdateSearch,
  hoveredId,
  activeId,
  onHover,
  lang,
  searchLinkContext,
  dict,
}: {
  items: BraiderSearchItem[];
  pagination: PaginationMeta | null;
  hasError: boolean;
  isLoading: boolean;
  isUpdating: boolean;
  onRetry: () => void;
  locationLabel: string | null;
  hasCoords: boolean;
  radiusKm: number;
  filters: SearchFilters;
  onUpdateSearch: (patch: SearchPatch) => void;
  hoveredId: string | null;
  activeId: string | null;
  onHover: (id: string | null) => void;
  lang: Locale;
  searchLinkContext: SearchLinkContext;
  dict: SearchResultsDict;
}) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (activeId) {
      cardRefs.current[activeId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeId]);

  const count = pagination?.total_items ?? items.length;
  const hasFilters =
    filters.minPrice != null ||
    filters.maxPrice != null ||
    !!filters.minRating ||
    !!filters.mobileOnly;
  const widerRadius = RADIUS_PRESETS_KM.find((r) => r > radiusKm);

  const subtitle = locationLabel
    ? hasCoords
      ? formatTemplate(dict.withinRadiusOf, { radius: radiusKm, location: locationLabel })
      : formatTemplate(dict.inLocation, { location: locationLabel })
    : null;

  return (
    <div className="flex flex-1 flex-col pb-36 md:pb-10">
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/95 px-4 pt-5 pb-3 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {isLoading ? (
                <span className="inline-block h-7 w-36 animate-pulse rounded-lg bg-border/60 align-middle" />
              ) : (
                formatTemplate(count === 1 ? dict.resultsCountOne : dict.resultsCountOther, {
                  count,
                })
              )}
            </h1>
            {subtitle && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <SearchFiltersBar
          hasCoords={hasCoords}
          radiusKm={radiusKm}
          filters={filters}
          onUpdateSearch={onUpdateSearch}
          dict={dict}
        />
        {/* Slim indeterminate bar while the next result set loads — the
            current cards stay put (dimmed) instead of blanking out. */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-200 ${
            isUpdating ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        >
          <div className="search-progress h-full w-1/3 rounded-full bg-brand" />
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col px-4 pt-5 transition-opacity duration-300 sm:px-6 lg:px-8 ${
          isUpdating ? "pointer-events-none opacity-50" : ""
        }`}
        aria-busy={isUpdating || isLoading}
      >
        {hasError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
            <AlertCircle className="size-10 text-icon-muted" />
            <h2 className="text-base font-semibold text-foreground">{dict.errorTitle}</h2>
            <p className="max-w-xs text-sm text-muted-foreground">{dict.errorSubtitle}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-border/40"
            >
              <RotateCw className="size-4" />
              {dict.retry}
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-border/40">
              <SearchX className="size-6 text-icon-muted" />
            </span>
            <h2 className="text-base font-semibold text-foreground">{dict.noResultsTitle}</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              {hasCoords && widerRadius
                ? formatTemplate(dict.noResultsInRadius, { radius: radiusKm })
                : dict.noResultsSubtitle}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {hasCoords && widerRadius && radiusKm < MAX_RADIUS_KM && (
                <button
                  type="button"
                  onClick={() => onUpdateSearch({ radius_km: String(widerRadius) })}
                  className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  {formatTemplate(dict.expandRadius, { radius: widerRadius })}
                </button>
              )}
              {hasFilters && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSearch({
                      min_price: null,
                      max_price: null,
                      min_rating: null,
                      mobile: null,
                    })
                  }
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-border/40"
                >
                  {dict.clearFilters}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={(el) => {
                  cardRefs.current[item.id] = el;
                }}
                className="search-card-in"
                style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
              >
                <BraiderCard
                  item={item}
                  isHighlighted={hoveredId === item.id || activeId === item.id}
                  onHover={onHover}
                  lang={lang}
                  searchLinkContext={searchLinkContext}
                  dict={dict}
                />
              </div>
            ))}
          </div>
        )}

        {pagination && !hasError && items.length > 0 && (
          <div className="mt-8">
            <PaginationControl
              pagination={pagination}
              onChangePage={(page) => onUpdateSearch({ page: String(page) })}
              dict={dict}
            />
          </div>
        )}
      </div>
    </div>
  );
}
