"use client";

import { useMemo, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { searchDestinations } from "@/lib/search-destinations";
import type { SelectedLocation, WherePanelDict } from "@/components/search/types";

export function WherePanel({
  query,
  onQueryChange,
  onSelect,
  dict,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (location: SelectedLocation) => void;
  dict: WherePanelDict;
}) {
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">(
    "idle"
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchDestinations;
    return searchDestinations.filter(
      (d) =>
        d.city.toLowerCase().includes(q) || d.country.toLowerCase().includes(q)
    );
  }, [query]);

  function handleNearby() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState("idle");
        onSelect({
          label: dict.nearbyLabel,
          isNearby: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setGeoState("error"),
      { timeout: 10000 }
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-input px-4 py-3 focus-within:border-brand">
        <Search className="size-4 shrink-0 text-icon-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
        />
      </div>

      <p className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {dict.suggestedHeading}
      </p>

      <ul className="-mx-2 flex max-h-[320px] flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <li>
          <button
            type="button"
            onClick={handleNearby}
            className="flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-border/40"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-border/50 text-foreground">
              <LocateFixed
                className={`size-5 ${geoState === "loading" ? "animate-pulse" : ""}`}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {dict.nearbyLabel}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {geoState === "error"
                  ? dict.geoUnsupportedMessage
                  : dict.nearbyDescription}
              </span>
            </span>
          </button>
        </li>

        {filtered.map((destination) => (
          <li key={destination.id}>
            <button
              type="button"
              onClick={() =>
                onSelect({
                  label: `${destination.city}, ${destination.country}`,
                })
              }
              className="flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-border/40"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-border/50 text-xl">
                {destination.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {destination.city}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {destination.country}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
