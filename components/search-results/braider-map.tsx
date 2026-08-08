"use client";

import { useEffect, useMemo } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
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

function FitBounds({
  pins,
  center,
}: {
  pins: Pin[];
  center: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      map.setZoom(13);
      return;
    }

    if (pins.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      pins.forEach((pin) => bounds.extend({ lat: pin.lat, lng: pin.lng }));
      map.fitBounds(bounds, 64);
      return;
    }

    if (center) {
      map.setCenter(center);
      map.setZoom(12);
    } else {
      map.setCenter(FALLBACK_CENTER);
      map.setZoom(FALLBACK_ZOOM);
    }
    // Only re-run when the pin set or center actually changes, not on every
    // map instance re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pins.length, center?.lat, center?.lng]);

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

  useEffect(() => {
    if (!map || !activeId) return;
    const pin = pins.find((p) => p.item.id === activeId);
    if (pin) {
      map.panTo({ lat: pin.lat, lng: pin.lng });
      map.setZoom(15);
    }
  }, [map, pins, activeId]);

  return null;
}

export function BraiderMap({
  items,
  center,
  hoveredId,
  activeId,
  onHoverPin,
  onSelectPin,
}: {
  items: BraiderSearchItem[];
  center: { lat: number; lng: number } | null;
  hoveredId: string | null;
  activeId: string | null;
  onHoverPin: (id: string | null) => void;
  onSelectPin: (id: string) => void;
}) {
  const { resolvedTheme } = useTheme();

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
      colorScheme={resolvedTheme === "dark" ? "DARK" : "LIGHT"}
      gestureHandling="greedy"
      disableDefaultUI
      zoomControl
      className="h-full w-full"
    >
      <FitBounds pins={pins} center={center} />
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
