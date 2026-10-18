"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap } from "@vis.gl/react-google-maps";

// A React-rendered marker for maps without a mapId (AdvancedMarker needs
// one, and a mapId would disable our JSON map styles — see map-styles.ts).
// The content is anchored by its bottom-center to the coordinate, so a pin
// with a tail points exactly at the spot.
export function HtmlMarker({
  position,
  zIndex = 1,
  onClick,
  children,
}: {
  position: google.maps.LatLngLiteral;
  zIndex?: number;
  onClick?: () => void;
  children: ReactNode;
}) {
  const map = useMap();
  const container = useMemo(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.transform = "translate(-50%, -100%)";
    return el;
  }, []);
  const [overlay, setOverlay] = useState<google.maps.OverlayView | null>(null);

  useEffect(() => {
    if (!map || !container) return;

    class Overlay extends google.maps.OverlayView {
      latLng = new google.maps.LatLng(position);
      onAdd() {
        this.getPanes()?.overlayMouseTarget.appendChild(container!);
      }
      draw() {
        const point = this.getProjection()?.fromLatLngToDivPixel(this.latLng);
        if (!point) return;
        container!.style.left = `${point.x}px`;
        container!.style.top = `${point.y}px`;
      }
      onRemove() {
        container!.remove();
      }
    }

    // Clicks/drags on the marker shouldn't also hit the map underneath
    // (which would close the preview card the click just opened).
    google.maps.OverlayView.preventMapHitsAndGesturesFrom(container);
    const instance = new Overlay();
    instance.setMap(map);
    setOverlay(instance);
    return () => {
      instance.setMap(null);
      setOverlay(null);
    };
    // Position updates are applied below without recreating the overlay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, container]);

  useEffect(() => {
    if (!overlay) return;
    (overlay as google.maps.OverlayView & { latLng: google.maps.LatLng }).latLng =
      new google.maps.LatLng(position);
    overlay.draw();
  }, [overlay, position.lat, position.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (container) container.style.zIndex = String(zIndex);
  }, [container, zIndex]);

  useEffect(() => {
    if (!container || !onClick) return;
    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [container, onClick]);

  if (!container) return null;
  return createPortal(children, container);
}
