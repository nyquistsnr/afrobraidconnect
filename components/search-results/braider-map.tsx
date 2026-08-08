"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { AdvancedMarker, Map, useMap, MapEvent } from "@vis.gl/react-google-maps";
import { Plus, Minus, Maximize, Minimize, Moon, Sun, Monitor } from "lucide-react";
import type { BraiderSearchItem } from "@/lib/api/types";
import { displayStyle, formatPrice } from "@/lib/braider-pricing";

import { useTheme } from "@/components/theme/theme-provider";

// Advanced Markers need a Map ID to render custom HTML content (otherwise
// they silently fall back to the default red pin). No real Map ID has been
// provisioned in Google Cloud Console yet, so this uses Google's public demo
// ID — fully functional, just not custom-styled. Override via
// NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID once a real one exists.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

// Berlin — a reasonable default center for this Germany-based platform when
// no location was searched and no braider has coordinates yet.
const FALLBACK_CENTER = { lat: 52.52, lng: 13.405 };
const FALLBACK_ZOOM = 5;

interface Pin {
  item: BraiderSearchItem;
  lat: number;
  lng: number;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function MapController({
  center,
}: {
  center: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (center) {
      const currentCenter = map.getCenter();
      // If we don't have a center or it's further than ~100 meters, update it
      if (
        !currentCenter ||
        getDistanceFromLatLonInKm(
          currentCenter.lat(),
          currentCenter.lng(),
          center.lat,
          center.lng
        ) > 0.1
      ) {
        map.setCenter(center);
        map.setZoom(12);
      }
    } else {
      const currentCenter = map.getCenter();
      if (
        !currentCenter ||
        getDistanceFromLatLonInKm(
          currentCenter.lat(),
          currentCenter.lng(),
          FALLBACK_CENTER.lat,
          FALLBACK_CENTER.lng
        ) > 0.1
      ) {
        map.setCenter(FALLBACK_CENTER);
        map.setZoom(FALLBACK_ZOOM);
      }
    }
  }, [map, center?.lat, center?.lng]);

  return null;
}

function FocusActivePin({
  pins,
  activeId,
}: {
  pins: Pin[];
  activeId: string | null;
}) {
  const map = useMap();
  const lastActiveId = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !activeId) {
      lastActiveId.current = activeId;
      return;
    }
    
    // Only pan if the activeId actually changed to a new one
    if (lastActiveId.current === activeId) return;

    const pin = pins.find((p) => p.item.id === activeId);
    if (pin) {
      map.panTo({ lat: pin.lat, lng: pin.lng });
      map.setZoom(15);
      lastActiveId.current = activeId;
    }
  }, [map, pins, activeId]);

  return null;
}

function CustomMapControls({
  isExpanded,
  onToggleExpand,
  mapTheme,
  onChangeMapTheme,
}: {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  mapTheme: "system" | "dark" | "light";
  onChangeMapTheme: (theme: "system" | "dark" | "light") => void;
}) {
  const map = useMap();

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      <div className="flex flex-col overflow-hidden rounded-xl bg-surface/90 backdrop-blur-md shadow-lg border border-border">
        <button
          type="button"
          onClick={() => map?.setZoom((map.getZoom() ?? 0) + 1)}
          className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted transition-colors active:bg-muted/80 border-b border-border/50"
          aria-label="Zoom in"
        >
          <Plus className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => map?.setZoom((map.getZoom() ?? 0) - 1)}
          className="flex h-10 w-10 items-center justify-center text-foreground hover:bg-muted transition-colors active:bg-muted/80"
          aria-label="Zoom out"
        >
          <Minus className="size-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          const next =
            mapTheme === "system"
              ? "dark"
              : mapTheme === "dark"
              ? "light"
              : "system";
          onChangeMapTheme(next);
        }}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface/90 backdrop-blur-md shadow-lg border border-border text-foreground hover:bg-muted transition-colors active:bg-muted/80"
        aria-label="Toggle map theme"
        title={`Map theme: ${mapTheme}`}
      >
        {mapTheme === "dark" && <Moon className="size-5" />}
        {mapTheme === "light" && <Sun className="size-5" />}
        {mapTheme === "system" && <Monitor className="size-5" />}
      </button>

      {onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          className="hidden md:flex mt-2 h-10 w-10 items-center justify-center rounded-xl bg-surface/90 backdrop-blur-md shadow-lg border border-border text-foreground hover:bg-muted transition-colors active:bg-muted/80"
          aria-label={isExpanded ? "Collapse map" : "Expand map"}
        >
          {isExpanded ? (
            <Minimize className="size-5" />
          ) : (
            <Maximize className="size-5" />
          )}
        </button>
      )}
    </div>
  );
}

export function BraiderMap({
  items,
  center,
  hoveredId,
  activeId,
  onHoverPin,
  onSelectPin,
  isExpanded,
  onToggleExpand,
  onMapIdle,
}: {
  items: BraiderSearchItem[];
  center: { lat: number; lng: number } | null;
  hoveredId: string | null;
  activeId: string | null;
  onHoverPin: (id: string | null) => void;
  onSelectPin: (id: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onMapIdle?: (lat: number, lng: number, radiusKm: number) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [mapTheme, setMapTheme] = useState<"system" | "dark" | "light">("system");
  
  const effectiveColorScheme =
    mapTheme === "system"
      ? resolvedTheme === "dark"
        ? "DARK"
        : "LIGHT"
      : mapTheme === "dark"
      ? "DARK"
      : "LIGHT";

  const lastIdleRef = useRef<{ lat: number; lng: number; radius: number } | null>(null);

  const handleIdle = useCallback(
    (e: MapEvent) => {
      if (!onMapIdle) return;
      const map = e.map;
      const currentCenter = map.getCenter();
      const bounds = map.getBounds();
      if (!currentCenter || !bounds) return;

      const lat = currentCenter.lat();
      const lng = currentCenter.lng();
      const ne = bounds.getNorthEast();
      const radiusKm = getDistanceFromLatLonInKm(
        lat,
        lng,
        ne.lat(),
        ne.lng()
      );

      const cappedRadius = Math.max(1, Math.min(Math.round(radiusKm), 100));

      // Prevent firing if the map hasn't meaningfully moved (>50 meters) and radius is the same
      if (lastIdleRef.current) {
        const dist = getDistanceFromLatLonInKm(
          lastIdleRef.current.lat,
          lastIdleRef.current.lng,
          lat,
          lng
        );
        if (dist < 0.05 && lastIdleRef.current.radius === cappedRadius) {
          return;
        }
      }

      lastIdleRef.current = { lat, lng, radius: cappedRadius };
      onMapIdle(lat, lng, cappedRadius);
    },
    [onMapIdle]
  );

  const pins = useMemo<Pin[]>(() => {
    const result: Pin[] = [];
    for (const item of items) {
      const latRaw = item.location?.latitude;
      const lngRaw = item.location?.longitude;
      if (latRaw != null && lngRaw != null) {
        const lat = Number(latRaw);
        const lng = Number(lngRaw);
        if (!isNaN(lat) && !isNaN(lng)) {
          result.push({ item, lat, lng });
        }
      }
    }
    return result;
  }, [items]);

  return (
    <Map
      mapId={MAP_ID}
      defaultCenter={center ?? FALLBACK_CENTER}
      defaultZoom={center ? 12 : FALLBACK_ZOOM}
      minZoom={7}
      colorScheme={effectiveColorScheme}
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl={false}
      className="h-full w-full"
      onIdle={handleIdle}
    >
      <CustomMapControls
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        mapTheme={mapTheme}
        onChangeMapTheme={setMapTheme}
      />
      <MapController center={center} />
      <FocusActivePin pins={pins} activeId={activeId} />
      {pins.map(({ item, lat, lng }) => {
        const style = displayStyle(item);
        const isHighlighted = hoveredId === item.id || activeId === item.id;
        return (
          <AdvancedMarker
            key={item.id}
            position={{ lat, lng }}
            zIndex={isHighlighted ? 999 : 1}
            onClick={() => onSelectPin(item.id)}
          >
            <button
              type="button"
              onMouseEnter={() => onHoverPin(item.id)}
              onMouseLeave={() => onHoverPin(null)}
              className={`flex cursor-pointer items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap shadow-md transition-all select-none ${
                isHighlighted
                  ? "scale-110 border-foreground bg-foreground text-background"
                  : "border-border bg-surface text-foreground hover:scale-105 hover:shadow-lg"
              }`}
            >
              {style ? `€${formatPrice(style.base_price)}` : "•"}
            </button>
          </AdvancedMarker>
        );
      })}
    </Map>
  );
}
