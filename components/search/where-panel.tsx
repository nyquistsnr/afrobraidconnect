"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed, Search, MapPin, Check, History } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { searchDestinations } from "@/lib/search-destinations";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { addRecentLocation, getRecentLocations } from "@/lib/recent-locations";
import type { SelectedLocation, WherePanelDict } from "@/components/search/types";

export function WherePanel({
  initialQuery = "",
  onSelect,
  selectedLabel,
  selectedIsNearby,
  dict,
}: {
  initialQuery?: string;
  onSelect: (location: SelectedLocation) => void;
  selectedLabel?: string;
  selectedIsNearby?: boolean;
  dict: WherePanelDict;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [geoState, setGeoState] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [recentLocations, setRecentLocations] = useState<SelectedLocation[]>([]);

  useEffect(() => {
    setRecentLocations(getRecentLocations());
  }, []);

  function selectLocation(location: SelectedLocation) {
    setRecentLocations(addRecentLocation(location));
    onSelect(location);
  }

  // Real-world place search (any city worldwide), layered on top of the
  // curated suggestions below — mirrors Airbnb letting you type any
  // destination rather than only picking from a fixed list.
  const placesLibrary = useMapsLibrary("places");
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  );

  useEffect(() => {
    if (!placesLibrary) return;
    sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
  }, [placesLibrary]);

  const debouncedQuery = useDebouncedValue(query, 300).trim();

  const { data: predictions = [], isFetching: predictionsLoading } = useQuery({
    queryKey: ["header-search-places", debouncedQuery],
    queryFn: async () => {
      if (!placesLibrary) {
        throw new Error("Places library isn't ready yet.");
      }
      const request = {
        input: debouncedQuery,
        includedPrimaryTypes: ["locality"],
        sessionToken: sessionTokenRef.current ?? undefined,
      };
      try {
        const { suggestions } = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        return suggestions;
      } catch (e) {
        return [];
      }
    },
    enabled: Boolean(placesLibrary) && debouncedQuery.length > 0,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return searchDestinations;
    return searchDestinations.filter((d) => {
      const combined = `${d.city}, ${d.country}`.toLowerCase();
      return (
        combined.includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q)
      );
    });
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
        selectLocation({
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

  async function handlePredictionSelect(
    suggestion: any
  ) {
    const label = suggestion.placePrediction?.text?.text ?? "";
    if (!placesLibrary || !suggestion.placePrediction) {
      selectLocation({ label });
      return;
    }
    
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ["location", "displayName"] });
      
      if (place.location) {
        selectLocation({
          label,
          lat: place.location.lat(),
          lng: place.location.lng(),
        });
      } else {
        selectLocation({ label });
      }
    } catch (e) {
      selectLocation({ label });
    }
    
    sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
  }

  const showSearchResults =
    debouncedQuery.length > 0 && (predictionsLoading || predictions.length > 0);

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
        {predictionsLoading && (
          <Loader className="size-4 shrink-0 animate-spin text-icon-muted" />
        )}
      </div>

      {/* One shared scroll region for recent/suggested/live-results, so
          scrolling moves them together as a single list instead of the
          suggested destinations scrolling in their own box underneath a
          fixed recent-searches section. */}
      <div className="mt-5 flex flex-col sm:max-h-[400px] sm:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {!query.trim() && recentLocations.length > 0 && (
          <>
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {dict.recentHeading}
            </p>
            <ul className="-mx-2 mb-5 flex flex-col">
              {recentLocations.map((recent) => {
                const isSelected =
                  selectedIsNearby === recent.isNearby &&
                  selectedLabel === recent.label;
                return (
                  <li key={recent.label}>
                    <button
                      type="button"
                      onClick={() => selectLocation(recent)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-brand/5" : "hover:bg-border/40"
                      }`}
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-border/50 text-foreground">
                        {recent.isNearby ? (
                          <LocateFixed className="size-5" />
                        ) : (
                          <History className="size-5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {recent.label}
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
          </>
        )}

        <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {dict.suggestedHeading}
        </p>

        <ul className="-mx-2 flex flex-col">
          <li>
            <button
              type="button"
              onClick={handleNearby}
              aria-pressed={selectedIsNearby}
              className={`flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors ${
                selectedIsNearby ? "bg-brand/5" : "hover:bg-border/40"
              }`}
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
              {selectedIsNearby && (
                <Check className="size-4 shrink-0 text-brand" strokeWidth={3} />
              )}
            </button>
          </li>

          {filtered.map((destination) => {
            const label = `${destination.city}, ${destination.country}`;
            const isSelected = !selectedIsNearby && selectedLabel === label;
            return (
              <li key={destination.id}>
                <button
                  type="button"
                  onClick={() =>
                    selectLocation({
                      label,
                      countryCode: destination.countryCode,
                    })
                  }
                  aria-pressed={isSelected}
                  className={`flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-brand/5" : "hover:bg-border/40"
                  }`}
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

        {showSearchResults && (
          <>
            <p className="mt-5 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {dict.searchResultsHeading}
            </p>
            <ul className="-mx-2 flex flex-col">
              {predictionsLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3.5 px-2 py-2.5">
                    <span className="size-12 shrink-0 animate-pulse rounded-xl bg-border/50" />
                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                      <span className="h-3 w-1/3 animate-pulse rounded-full bg-border/50" />
                      <span className="h-2.5 w-1/2 animate-pulse rounded-full bg-border/40" />
                    </span>
                  </li>
                ))}

              {!predictionsLoading &&
                predictions.map((suggestion: any) => {
                  const prediction = suggestion.placePrediction;
                  if (!prediction) return null;
                  const label = prediction.text?.text ?? "";
                  const isSelected = !selectedIsNearby && selectedLabel === label;

                  return (
                    <li key={prediction.placeId}>
                      <button
                        type="button"
                        onClick={() => handlePredictionSelect(suggestion)}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors ${
                          isSelected ? "bg-brand/5" : "hover:bg-border/40"
                        }`}
                      >
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-border/50 text-foreground">
                          <MapPin className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">
                            {prediction.mainText?.text}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {prediction.secondaryText?.text}
                          </span>
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
          </>
        )}
      </div>
    </div>
  );
}
