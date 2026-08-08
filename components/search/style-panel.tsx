"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Search, ImageOff, Check } from "lucide-react";
import { catalogApi } from "@/lib/api/catalog-client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Locale } from "@/lib/i18n";
import type { SelectedStyle, StylePanelDict } from "@/components/search/types";

export function StylePanel({
  lang,
  onSelect,
  initialQuery = "",
  selectedId,
  dict,
}: {
  lang: Locale;
  onSelect: (style: SelectedStyle) => void;
  initialQuery?: string;
  selectedId?: string;
  dict: StylePanelDict;
}) {
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["header-search-styles", debouncedQuery, lang],
    queryFn: () =>
      catalogApi.getStyles(
        { search: debouncedQuery || undefined, page: 1, pageSize: 8 },
        lang
      ),
    staleTime: 60_000,
  });

  const items = data?.items ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-input px-4 py-3 focus-within:border-brand">
        <Search className="size-4 shrink-0 text-icon-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
        />
      </div>

      {!isLoading && !isError && items.length > 0 && (
        <p className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {dict.popularHeading}
        </p>
      )}

      <ul className="-mx-2 mt-1 flex max-h-[320px] flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3.5 px-2 py-2.5">
              <span className="size-14 shrink-0 animate-pulse rounded-xl bg-border/50" />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="h-3 w-2/5 animate-pulse rounded-full bg-border/50" />
                <span className="h-2.5 w-4/5 animate-pulse rounded-full bg-border/40" />
              </span>
            </li>
          ))}

        {isError && (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">
            {dict.loadError}
          </li>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">
            {dict.noResults}
          </li>
        )}

        {!isLoading &&
          !isError &&
          items.map((style) => {
            const imageUrl = style.images[0]?.url;
            const isSelected = selectedId === style.id;
            return (
              <li key={style.id}>
                <button
                  type="button"
                  onClick={() =>
                    onSelect({
                      id: style.id,
                      name: style.name,
                      imageUrl,
                    })
                  }
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-brand/5" : "hover:bg-border/40"
                  }`}
                >
                  <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-border/50">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <ImageOff className="size-5 text-icon-muted" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {style.name}
                    </span>
                    {style.description && (
                      <span className="line-clamp-1 text-xs text-muted-foreground">
                        {style.description}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <Check
                      className="size-4 shrink-0 text-brand"
                      strokeWidth={3}
                    />
                  )}
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
