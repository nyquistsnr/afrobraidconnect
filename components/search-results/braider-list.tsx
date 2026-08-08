"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, SearchX } from "lucide-react";
import type { BraiderSearchItem, PaginationMeta } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { formatTemplate } from "@/lib/format-template";
import { BraiderCard } from "@/components/search-results/braider-card";
import { PaginationControl } from "@/components/search-results/pagination-control";
import { RadiusSelector } from "@/components/search-results/radius-selector";
import type { SearchResultsDict } from "@/components/search-results/types";

export function BraiderList({
  items,
  pagination,
  hasError,
  locationLabel,
  radiusKm,
  hoveredId,
  activeId,
  onHover,
  onChangePage,
  onChangeRadius,
  isPending,
  lang,
  dict,
}: {
  items: BraiderSearchItem[];
  pagination: PaginationMeta | null;
  hasError: boolean;
  locationLabel: string | null;
  radiusKm: number;
  hoveredId: string | null;
  activeId: string | null;
  onHover: (id: string | null) => void;
  onChangePage: (page: number) => void;
  onChangeRadius: (radius: number) => void;
  isPending: boolean;
  lang: Locale;
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

  if (hasError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <AlertCircle className="size-10 text-icon-muted" />
        <h2 className="text-base font-semibold text-foreground">
          {dict.errorTitle}
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          {dict.errorSubtitle}
        </p>
      </div>
    );
  }

  const count = pagination?.total_items ?? items.length;

  return (
    <div
      className={`flex flex-1 flex-col px-4 pt-5 pb-24 transition-opacity duration-200 sm:px-6 md:pb-10 lg:px-8 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            {formatTemplate(
              count === 1 ? dict.resultsCountOne : dict.resultsCountOther,
              { count }
            )}
          </h1>
          {locationLabel && (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatTemplate(dict.inLocation, { location: locationLabel })}
            </p>
          )}
        </div>
        {locationLabel && (
          <div className="flex-shrink-0">
            <RadiusSelector
              radiusKm={radiusKm}
              onChangeRadius={onChangeRadius}
              isPending={isPending}
            />
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <SearchX className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">
            {dict.noResultsTitle}
          </h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {dict.noResultsSubtitle}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current[item.id] = el;
              }}
            >
              <BraiderCard
                item={item}
                isHighlighted={hoveredId === item.id || activeId === item.id}
                onHover={onHover}
                lang={lang}
                dict={dict}
              />
            </div>
          ))}
        </div>
      )}

      {pagination && (
        <div className="mt-8">
          <PaginationControl
            pagination={pagination}
            onChangePage={onChangePage}
            dict={dict}
          />
        </div>
      )}
    </div>
  );
}
