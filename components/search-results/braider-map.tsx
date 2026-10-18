"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Circle,
  Map,
  useMap,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import {
  ImageOff,
  Loader2,
  LocateFixed,
  Maximize,
  Minimize,
  Minus,
  Monitor,
  Moon,
  Plus,
  Search,
  Star,
  Sun,
  X,
} from "lucide-react";
import type { BraiderSearchItem } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { MAX_RADIUS_KM, type SearchLinkContext } from "@/lib/search-query";
import { displayStyle, formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import { useTheme } from "@/components/theme/theme-provider";
import { HtmlMarker } from "@/components/maps/html-marker";
import {
  DARK_MAP_STYLES,
  LIGHT_MAP_STYLES,
  MAP_BACKGROUND,
} from "@/components/maps/map-styles";
import { buildBraiderHref } from "@/components/search-results/braider-card";
import type { SearchResultsDict } from "@/components/search-results/types";

// Rendered without a mapId on purpose: our own JSON styles (map-styles.ts)
// only apply to non-cloud-styled maps, so markers are HtmlMarker overlays
// rather than AdvancedMarkers (which require a mapId).

// Berlin — a reasonable default center for this Germany-based platform when
// no location was searched and no braider has coordinates yet.
const FALLBACK_CENTER = { lat: 52.52, lng: 13.405 };
const FALLBACK_ZOOM = 5;
// Fitting to a single nearby braider shouldn't land at street level: bounds
// are padded to at least this span (degrees, roughly zoom 13).
const MIN_FIT_SPAN_DEG = 0.04;
const BRAND_COLOR = "#b9713f";

interface Pin {
  item: BraiderSearchItem;
  lat: number;
  lng: number;
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Re-frames the map around a search's results whenever `fitKey` changes
// (a new search, filter or page — but never a "Search this area", whose
// viewport the user picked on purpose). Frames the search center plus every
// pin; with no pins, frames the search circle so the empty area is visible.
function FitToResults({
  fitKey,
  fitNonce,
  pins,
  center,
  radiusKm,
  markProgrammatic,
}: {
  fitKey: string | null;
  fitNonce: number;
  pins: Pin[];
  center: { lat: number; lng: number } | null;
  radiusKm: number;
  markProgrammatic: () => void;
}) {
  const map = useMap();
  const pinsRef = useRef(pins);
  useEffect(() => {
    pinsRef.current = pins;
  }, [pins]);

  useEffect(() => {
    if (!map || fitKey == null) return;
    const currentPins = pinsRef.current;
    const bounds = new google.maps.LatLngBounds();

    if (currentPins.length > 0) {
      for (const pin of currentPins) bounds.extend({ lat: pin.lat, lng: pin.lng });
      if (center) bounds.extend(center);
    } else if (center) {
      const circle = new google.maps.Circle({ center, radius: radiusKm * 1000 });
      const circleBounds = circle.getBounds();
      if (circleBounds) bounds.union(circleBounds);
    } else {
      return;
    }

    const mid = bounds.getCenter();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const half = MIN_FIT_SPAN_DEG / 2;
    if (ne.lat() - sw.lat() < MIN_FIT_SPAN_DEG && ne.lng() - sw.lng() < MIN_FIT_SPAN_DEG) {
      bounds.extend({ lat: mid.lat() + half, lng: mid.lng() + half });
      bounds.extend({ lat: mid.lat() - half, lng: mid.lng() - half });
    }

    // On phones the collapsed results sheet (+ tab bar) covers the bottom of
    // the map, so frame the results in the part that stays visible.
    const isPhone = window.matchMedia("(max-width: 1023px)").matches;
    markProgrammatic();
    map.fitBounds(
      bounds,
      isPhone
        ? { top: 72, right: 56, bottom: 190, left: 24 }
        : { top: 72, right: 72, bottom: 48, left: 48 }
    );
    // pins are read via ref: a fit belongs to a search (fitKey), not to
    // every re-render that happens to produce a new pins array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey, fitNonce]);

  return null;
}

// Brings a selected pin into view without changing the zoom level — the old
// behavior zoomed to street level on every click, losing the overview.
function RevealActivePin({
  pin,
  markProgrammatic,
}: {
  pin: Pin | null;
  markProgrammatic: () => void;
}) {
  const map = useMap();
  const pinId = pin?.item.id;

  useEffect(() => {
    if (!map || !pin) return;
    const bounds = map.getBounds();
    if (bounds && bounds.contains({ lat: pin.lat, lng: pin.lng })) return;
    markProgrammatic();
    map.panTo({ lat: pin.lat, lng: pin.lng });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pinId]);

  return null;
}

function MapButton({
  onClick,
  label,
  children,
  className = "",
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-10 items-center justify-center text-foreground transition-colors hover:bg-border/40 active:bg-border/60 ${className}`}
    >
      {children}
    </button>
  );
}

function MapControls({
  isExpanded,
  onToggleExpand,
  mapTheme,
  onChangeMapTheme,
  onRecenter,
  dict,
}: {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  mapTheme: "system" | "dark" | "light";
  onChangeMapTheme: (theme: "system" | "dark" | "light") => void;
  onRecenter: () => void;
  dict: SearchResultsDict;
}) {
  const map = useMap();
  const card =
    "overflow-hidden rounded-xl border border-border bg-surface/95 shadow-lg backdrop-blur-md";

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <div className={`flex flex-col ${card}`}>
        <MapButton
          onClick={() => map?.setZoom((map.getZoom() ?? 0) + 1)}
          label={dict.zoomIn}
          className="border-b border-border/60"
        >
          <Plus className="size-5" />
        </MapButton>
        <MapButton onClick={() => map?.setZoom((map.getZoom() ?? 0) - 1)} label={dict.zoomOut}>
          <Minus className="size-5" />
        </MapButton>
      </div>
      <div className={card}>
        <MapButton onClick={onRecenter} label={dict.recenterMap}>
          <LocateFixed className="size-5" />
        </MapButton>
      </div>
      <div className={card}>
        <MapButton
          onClick={() =>
            onChangeMapTheme(
              mapTheme === "system" ? "dark" : mapTheme === "dark" ? "light" : "system"
            )
          }
          label={dict.mapTheme}
        >
          {mapTheme === "dark" && <Moon className="size-5" />}
          {mapTheme === "light" && <Sun className="size-5" />}
          {mapTheme === "system" && <Monitor className="size-5" />}
        </MapButton>
      </div>
      {onToggleExpand && (
        <div className={`hidden lg:block ${card}`}>
          <MapButton
            onClick={onToggleExpand}
            label={isExpanded ? dict.collapseMap : dict.expandMap}
          >
            {isExpanded ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </MapButton>
        </div>
      )}
    </div>
  );
}

function PinPreviewCard({
  item,
  href,
  onClose,
  dict,
}: {
  item: BraiderSearchItem;
  href: string;
  onClose: () => void;
  dict: SearchResultsDict;
}) {
  const style = displayStyle(item);
  const city = [item.location?.city, item.location?.country].filter(Boolean).join(", ");

  return (
    <div className="search-pop-in absolute inset-x-3 bottom-[calc(var(--sheet-peek,0px)+12px)] z-20 sm:inset-x-auto sm:left-4 sm:w-[360px] lg:bottom-6 lg:left-6 lg:w-[340px]">
      <div className="relative flex overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <Link href={href} className="flex min-w-0 flex-1">
          <span className="relative w-28 shrink-0 bg-border/50">
            {item.cover_photo_url ? (
              <Image
                src={item.cover_photo_url}
                alt={formatTemplate(dict.imageAlt, { name: item.business_name ?? "" })}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center">
                <ImageOff className="size-6 text-icon-muted" />
              </span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3 pr-9">
            <span className="truncate text-sm font-semibold text-foreground">
              {item.business_name ?? "—"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.rating && (
                <span className="flex items-center gap-0.5 font-semibold text-foreground">
                  <Star className="size-3 fill-current" />
                  {Number(item.rating).toFixed(1)}
                </span>
              )}
              {item.rating && item.distance_km != null && <span>·</span>}
              {item.distance_km != null && (
                <span>{formatTemplate(dict.distanceAway, { distance: item.distance_km })}</span>
              )}
            </span>
            {city && <span className="truncate text-xs text-muted-foreground">{city}</span>}
            {style && (
              <span className="mt-auto pt-1 text-sm font-semibold text-foreground">
                {formatTemplate(dict.fromPrice, { price: formatPrice(style.base_price) })}
              </span>
            )}
            <span className="text-xs font-semibold text-brand">{dict.viewProfile} →</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.closePreview}
          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-sm hover:bg-border/60"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function BraiderMap({
  items,
  center,
  radiusKm,
  fitKey,
  isUpdating,
  hoveredId,
  activeId,
  onHoverPin,
  onSelectPin,
  onSearchArea,
  isExpanded,
  onToggleExpand,
  lang,
  searchLinkContext,
  dict,
}: {
  items: BraiderSearchItem[];
  center: { lat: number; lng: number } | null;
  radiusKm: number;
  fitKey: string | null;
  isUpdating: boolean;
  hoveredId: string | null;
  activeId: string | null;
  onHoverPin: (id: string | null) => void;
  onSelectPin: (id: string | null) => void;
  onSearchArea: (lat: number, lng: number, radiusKm: number) => Promise<void>;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  lang: Locale;
  searchLinkContext: SearchLinkContext;
  dict: SearchResultsDict;
}) {
  const { resolvedTheme } = useTheme();
  const [mapTheme, setMapTheme] = useState<"system" | "dark" | "light">("system");
  const isDark = (mapTheme === "system" ? resolvedTheme : mapTheme) === "dark";

  // The map never searches by itself. A user pan/zoom just offers a
  // "Search this area" button (Airbnb-style), so browsing the map can't
  // silently shrink the radius or rename the location.
  const [userMoved, setUserMoved] = useState(false);
  const [searchingArea, setSearchingArea] = useState(false);
  const [fitNonce, setFitNonce] = useState(0);
  const cameraRef = useRef<{ lat: number; lng: number; radiusKm: number } | null>(null);
  // True while a camera change is ours (fitBounds/panTo/setZoom), so it
  // isn't mistaken for the user exploring. Cleared on the next idle.
  const programmaticRef = useRef(true);
  const markProgrammatic = useCallback(() => {
    programmaticRef.current = true;
  }, []);

  // A new search re-frames the map, so the "search this area" offer for
  // the old viewport no longer applies.
  const [prevFitKey, setPrevFitKey] = useState(fitKey);
  if (fitKey !== prevFitKey) {
    setPrevFitKey(fitKey);
    if (fitKey != null) setUserMoved(false);
  }

  const pins = useMemo<Pin[]>(() => {
    const result: Pin[] = [];
    for (const item of items) {
      const lat = Number(item.location?.latitude);
      const lng = Number(item.location?.longitude);
      if (item.location?.latitude != null && !isNaN(lat) && !isNaN(lng)) {
        result.push({ item, lat, lng });
      }
    }
    return result;
  }, [items]);

  const activePin = pins.find((p) => p.item.id === activeId) ?? null;
  const activeItem = activePin?.item ?? null;

  function handleCameraChanged(event: MapCameraChangedEvent) {
    const { center: c, bounds } = event.detail;
    // Out to the farther visible edge (not the corner, which reaches well
    // past what's on screen), so "this area" means roughly what you see.
    const radius = Math.max(
      distanceKm(c.lat, c.lng, bounds.north, c.lng),
      distanceKm(c.lat, c.lng, c.lat, bounds.east)
    );
    cameraRef.current = {
      lat: c.lat,
      lng: c.lng,
      radiusKm: Math.max(1, Math.min(Math.round(radius), MAX_RADIUS_KM)),
    };
    if (!programmaticRef.current) setUserMoved(true);
  }

  async function handleSearchArea() {
    const camera = cameraRef.current;
    if (!camera) return;
    setSearchingArea(true);
    try {
      await onSearchArea(camera.lat, camera.lng, camera.radiusKm);
      setUserMoved(false);
    } finally {
      setSearchingArea(false);
    }
  }

  const showSearchArea = userMoved && !isUpdating && !searchingArea;
  const showUpdating = isUpdating || searchingArea;

  return (
    <div className="relative h-full w-full">
      <Map
        defaultCenter={center ?? FALLBACK_CENTER}
        defaultZoom={center ? 10 : FALLBACK_ZOOM}
        minZoom={4}
        styles={isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES}
        backgroundColor={isDark ? MAP_BACKGROUND.dark : MAP_BACKGROUND.light}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        className="h-full w-full"
        onCameraChanged={handleCameraChanged}
        onIdle={() => {
          programmaticRef.current = false;
        }}
        onClick={() => onSelectPin(null)}
      >
        <FitToResults
          fitKey={fitKey}
          fitNonce={fitNonce}
          pins={pins}
          center={center}
          radiusKm={radiusKm}
          markProgrammatic={markProgrammatic}
        />
        <RevealActivePin pin={activePin} markProgrammatic={markProgrammatic} />

        {center && (
          <>
            <Circle
              center={center}
              radius={radiusKm * 1000}
              strokeColor={BRAND_COLOR}
              strokeOpacity={0.55}
              strokeWeight={1.5}
              fillColor={BRAND_COLOR}
              fillOpacity={0.06}
              clickable={false}
            />
            {/* The searched spot, Uber-style: a solid dot in a soft breathing
                halo — "this is where you are looking from". */}
            <HtmlMarker position={center} zIndex={0}>
              <span className="pointer-events-none relative flex size-12 translate-y-1/2 items-center justify-center">
                <span className="map-halo absolute inset-0 rounded-full bg-brand/25" />
                <span className="absolute inset-[30%] rounded-full bg-brand/20" />
                <span className="relative size-4 rounded-full border-[3px] border-white bg-brand shadow-[0_2px_8px_rgba(0,0,0,0.35)]" />
              </span>
            </HtmlMarker>
          </>
        )}

        {pins.map(({ item, lat, lng }) => {
          const style = displayStyle(item);
          const isActive = activeId === item.id;
          const isHovered = hoveredId === item.id;
          return (
            <HtmlMarker
              key={item.id}
              position={{ lat, lng }}
              zIndex={isActive ? 1000 : isHovered ? 999 : 1}
              onClick={() => onSelectPin(isActive ? null : item.id)}
            >
              {/* Price pin with a tail that points at the exact spot.
                  High-contrast against the muted map: ink on the light map,
                  white on the dark one, brand when selected. */}
              <button
                type="button"
                onMouseEnter={() => onHoverPin(item.id)}
                onMouseLeave={() => onHoverPin(null)}
                aria-label={item.business_name ?? undefined}
                aria-pressed={isActive}
                className={`map-pin group relative flex origin-bottom cursor-pointer flex-col items-center pb-1.5 transition-transform duration-200 ease-out select-none ${
                  isActive ? "scale-[1.15]" : isHovered ? "scale-110" : "hover:scale-105"
                }`}
                style={{
                  ["--pin-bg" as string]: isActive
                    ? BRAND_COLOR
                    : isDark
                      ? "#ffffff"
                      : "#1b1c1f",
                  ["--pin-fg" as string]: isActive || !isDark ? "#ffffff" : "#1b1c1f",
                }}
              >
                <span className="flex min-h-7 items-center rounded-full bg-[var(--pin-bg)] px-3 text-[13px] font-bold tracking-tight whitespace-nowrap text-[var(--pin-fg)] shadow-[0_4px_14px_rgba(0,0,0,0.28)] ring-2 ring-white/90 dark:ring-black/40">
                  {style ? `€${formatPrice(style.base_price)}` : "•"}
                </span>
                <span className="absolute bottom-0.5 size-2.5 rotate-45 rounded-[2px] bg-[var(--pin-bg)]" aria-hidden />
              </button>
            </HtmlMarker>
          );
        })}

        <MapControls
          isExpanded={isExpanded}
          onToggleExpand={onToggleExpand}
          mapTheme={mapTheme}
          onChangeMapTheme={setMapTheme}
          onRecenter={() => {
            setUserMoved(false);
            setFitNonce((n) => n + 1);
          }}
          dict={dict}
        />
      </Map>

      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
        {showSearchArea && (
          <button
            type="button"
            onClick={handleSearchArea}
            className="search-pop-in pointer-events-auto flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-xl transition-transform hover:scale-[1.03] active:scale-95"
          >
            <Search className="size-4" />
            {dict.searchThisArea}
          </button>
        )}
        {showUpdating && (
          <span className="search-pop-in flex items-center gap-2 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold text-foreground shadow-xl">
            <Loader2 className="size-4 animate-spin text-brand" />
            {dict.updatingResults}
          </span>
        )}
      </div>

      {activeItem && (
        <PinPreviewCard
          key={activeItem.id}
          item={activeItem}
          href={buildBraiderHref(activeItem, lang, searchLinkContext)}
          onClose={() => onSelectPin(null)}
          dict={dict}
        />
      )}
    </div>
  );
}
