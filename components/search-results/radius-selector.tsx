"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";

export function RadiusSelector({
  radiusKm,
  onChangeRadius,
  isPending,
}: {
  radiusKm: number;
  onChangeRadius: (radius: number) => void;
  isPending?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localRadius, setLocalRadius] = useState(radiusKm);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalRadius(radiusKm);
  }, [radiusKm]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset if cancelled
        setLocalRadius(radiusKm);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setLocalRadius(radiusKm);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, radiusKm]);

  function handleRelease() {
    if (localRadius !== radiusKm) {
      onChangeRadius(localRadius);
    }
    setIsOpen(false);
  }

  return (
    <div className={`relative ${isOpen ? "z-50" : ""}`} ref={containerRef}>
      {isOpen && (
        <div
          className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => {
            setIsOpen(false);
            setLocalRadius(radiusKm);
          }}
          aria-hidden
        />
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50 ${
          isOpen ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : ""
        }`}
      >
        <MapPin className="size-4 text-brand" />
        Within {radiusKm} km
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-surface p-5 shadow-xl animate-in fade-in zoom-in-95">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Search Radius</span>
            <span className="text-sm font-bold text-brand">{localRadius} km</span>
          </div>
          
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={localRadius}
            onChange={(e) => setLocalRadius(Number(e.target.value))}
            onMouseUp={handleRelease}
            onTouchEnd={handleRelease}
            className="w-full accent-brand"
          />
          
          <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
            <span>1 km</span>
            <span>100 km</span>
          </div>
        </div>
      )}
    </div>
  );
}
