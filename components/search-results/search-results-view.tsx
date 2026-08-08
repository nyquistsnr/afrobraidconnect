"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { BraiderSearchItem, PaginationMeta } from "@/lib/api/types";
import { BraiderList } from "@/components/search-results/braider-list";
import { BraiderMap } from "@/components/search-results/braider-map";
import { MobileViewToggle } from "@/components/search-results/mobile-view-toggle";
import type { SearchResultsDict } from "@/components/search-results/types";

export function SearchResultsView({
  items,
  pagination,
  hasError,
  locationLabel,
  radiusKm,
  center,
  dict,
}: {
  items: BraiderSearchItem[];
  pagination: PaginationMeta | null;
  hasError: boolean;
  locationLabel: string | null;
  radiusKm: number;
  center: { lat: number; lng: number } | null;
  dict: SearchResultsDict;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChangePage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSelect(id: string) {
    setActiveId((current) => (current === id ? null : id));
  }

  function handleChangeRadius(radius: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("radius_km", String(radius));
    // Reset page to 1 when changing radius
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <div
        className={`min-h-0 w-full md:w-[500px] lg:w-[650px] xl:w-[750px] flex-shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          mobileView === "map" || isMapExpanded ? "hidden md:hidden" : "block"
        }`}
      >
        <BraiderList
          items={items}
          pagination={pagination}
          hasError={hasError}
          locationLabel={locationLabel}
          radiusKm={radiusKm}
          hoveredId={hoveredId}
          activeId={activeId}
          onHover={setHoveredId}
          onSelect={handleSelect}
          onChangePage={handleChangePage}
          onChangeRadius={handleChangeRadius}
          isPending={isPending}
          dict={dict}
        />
      </div>

      <div
        className={`relative min-h-0 flex-1 ${
          isMapExpanded ? "" : "md:m-4 md:overflow-hidden md:rounded-2xl md:shadow-md"
        } ${mobileView === "list" && !isMapExpanded ? "hidden md:block" : "block"}`}
      >
        <BraiderMap
          items={items}
          center={center}
          hoveredId={hoveredId}
          activeId={activeId}
          onHoverPin={setHoveredId}
          onSelectPin={handleSelect}
          isExpanded={isMapExpanded}
          onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
        />
      </div>

      <MobileViewToggle
        view={mobileView}
        onToggle={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
        dict={dict}
      />
    </div>
  );
}
