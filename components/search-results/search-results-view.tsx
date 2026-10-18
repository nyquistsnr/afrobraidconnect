"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { braidersApi } from "@/lib/api/braiders-client";
import {
  DEFAULT_RADIUS_KM,
  parseSearchParams,
  searchCacheKey,
  type SearchLinkContext,
} from "@/lib/search-query";
import type { BraiderSearchItem, PaginatedData } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { BraiderList } from "@/components/search-results/braider-list";
import { BraiderMap } from "@/components/search-results/braider-map";
import { MobileViewToggle } from "@/components/search-results/mobile-view-toggle";
import { ResultsSheet } from "@/components/search-results/results-sheet";
import type { SearchResultsDict } from "@/components/search-results/types";

export type SearchPatch = Record<string, string | null>;

// Reverse-geocodes a map position to a town-level name for the header and
// results heading. Deliberately never falls back to a street address (the
// old behavior turned "Wrexham" into "23 Ernest Parry Rd" after a tiny drag);
// UK towns come back as postal_town rather than locality.
async function placeNameFor(lat: number, lng: number): Promise<string | null> {
  try {
    if (!window.google?.maps?.Geocoder) return null;
    const geocoder = new window.google.maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    for (const type of [
      "locality",
      "postal_town",
      "sublocality",
      "administrative_area_level_2",
    ]) {
      for (const result of results) {
        const match = result.address_components.find((c) => c.types.includes(type));
        if (match) return match.long_name;
      }
    }
  } catch {
    // Over quota / zero results — the caller falls back to a generic label.
  }
  return null;
}

export function SearchResultsView({
  lang,
  initialData,
  initialKey,
  dict,
}: {
  lang: Locale;
  initialData: PaginatedData<BraiderSearchItem> | null;
  initialKey: string;
  dict: SearchResultsDict;
}) {
  const searchParams = useSearchParams();
  const { ui, filters, api } = useMemo(
    () => parseSearchParams(Object.fromEntries(searchParams.entries())),
    [searchParams]
  );
  const key = searchCacheKey(api);

  const { data, isFetching, isPlaceholderData, isError, refetch } = useQuery({
    queryKey: ["braider-search", lang, key],
    queryFn: () => braidersApi.search(api, lang),
    initialData: key === initialKey && initialData ? initialData : undefined,
    // Keeps the current results on screen (dimmed) while the next set loads,
    // instead of flashing an empty list on every filter tweak.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Phone bottom sheet: expanded shows the list, collapsed shows the map.
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const listScrollRef = useRef<HTMLDivElement>(null);
  // Searches started from the map itself ("Search this area") keep the
  // viewport the user chose; every other search re-frames the map around
  // its results. Holds the cache key of the latest map-driven search.
  const [mapDrivenKey, setMapDrivenKey] = useState<string | null>(null);

  const center =
    ui.location?.lat != null && ui.location?.lng != null
      ? { lat: ui.location.lat, lng: ui.location.lng }
      : null;
  const radiusKm = ui.radiusKm ?? DEFAULT_RADIUS_KM;

  // Updates the query string in place (no server round trip) — Next syncs
  // useSearchParams with history.pushState, which re-keys the query above.
  const updateSearch = useCallback(
    (patch: SearchPatch, options: { mapDriven?: boolean } = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(patch)) {
        if (value == null || value === "") params.delete(name);
        else params.set(name, value);
      }
      if (!("page" in patch)) params.delete("page");
      if (options.mapDriven) {
        setMapDrivenKey(
          searchCacheKey(parseSearchParams(Object.fromEntries(params.entries())).api)
        );
      }
      setActiveId(null);
      const qs = params.toString();
      window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
    },
    [searchParams]
  );

  const handleSearchArea = useCallback(
    async (lat: number, lng: number, areaRadiusKm: number) => {
      const name = await placeNameFor(lat, lng);
      updateSearch(
        {
          lat: lat.toFixed(5),
          lng: lng.toFixed(5),
          radius_km: String(areaRadiusKm),
          location: name ?? dict.mapArea,
          country_code: null,
        },
        { mapDriven: true }
      );
    },
    [updateSearch, dict.mapArea]
  );

  // Each fresh result set starts at the top of the list.
  useEffect(() => {
    listScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [key]);

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? null;
  const isUpdating = isFetching && isPlaceholderData;
  const resultsReady = !!data && !isPlaceholderData;
  const fitKey =
    resultsReady && key !== mapDrivenKey ? key : null;

  // Carried onto each braider profile link so its header search bar shows
  // the same location/date/radius the customer already had set here.
  const searchLinkContext: SearchLinkContext = {
    location: searchParams.get("location"),
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    country_code: searchParams.get("country_code"),
    date_from: searchParams.get("date_from"),
    date_to: searchParams.get("date_to"),
    radius_km: searchParams.get("radius_km"),
  };

  return (
    // --sheet-peek: how much of the collapsed phone sheet stays visible —
    // handle + results heading, sitting above the fixed mobile tab bar
    // (which only exists below md). Below lg the list is a bottom sheet.
    <div className="relative flex min-h-0 flex-1 flex-col [--sheet-peek:calc(104px+60px+env(safe-area-inset-bottom))] md:[--sheet-peek:104px] lg:flex-row">
      <ResultsSheet
        expanded={sheetExpanded}
        onExpandedChange={setSheetExpanded}
        scrollRef={listScrollRef}
        handleLabel={sheetExpanded ? dict.showMap : dict.showList}
        className={`w-full lg:w-[560px] lg:flex-none xl:w-[750px] ${
          isMapExpanded ? "lg:hidden" : ""
        }`}
      >
        <BraiderList
          items={items}
          pagination={pagination}
          hasError={isError && !data}
          isLoading={!data && isFetching}
          isUpdating={isUpdating}
          onRetry={() => refetch()}
          locationLabel={ui.location?.label ?? null}
          hasCoords={center != null}
          radiusKm={radiusKm}
          filters={filters}
          onUpdateSearch={updateSearch}
          hoveredId={hoveredId}
          activeId={activeId}
          onHover={setHoveredId}
          lang={lang}
          searchLinkContext={searchLinkContext}
          dict={dict}
        />
      </ResultsSheet>

      {/* Below lg the map always fills the area behind the sheet (never
          display:none), so it can size and frame results correctly. */}
      <div
        className={`min-h-0 max-lg:absolute max-lg:inset-0 lg:relative lg:flex-1 ${
          isMapExpanded ? "" : "lg:m-4 lg:overflow-hidden lg:rounded-2xl lg:shadow-md"
        }`}
      >
        <BraiderMap
          items={items}
          center={center}
          radiusKm={radiusKm}
          fitKey={fitKey}
          isUpdating={isUpdating}
          hoveredId={hoveredId}
          activeId={activeId}
          onHoverPin={setHoveredId}
          onSelectPin={setActiveId}
          onSearchArea={handleSearchArea}
          isExpanded={isMapExpanded}
          onToggleExpand={() => setIsMapExpanded((v) => !v)}
          lang={lang}
          searchLinkContext={searchLinkContext}
          dict={dict}
        />
      </div>

      {sheetExpanded && (
        <MobileViewToggle
          view="list"
          onToggle={() => {
            setActiveId(null);
            setSheetExpanded(false);
          }}
          dict={dict}
        />
      )}
    </div>
  );
}
