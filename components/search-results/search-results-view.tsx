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
  center,
  dict,
}: {
  items: BraiderSearchItem[];
  pagination: PaginationMeta | null;
  hasError: boolean;
  locationLabel: string | null;
  center: { lat: number; lng: number } | null;
  dict: SearchResultsDict;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
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

  return (
    <div className="flex flex-1 flex-col pb-16 md:min-h-0 md:flex-row md:pb-0">
      <div
        className={`flex-1 overflow-y-auto md:max-w-[560px] lg:max-w-[640px] xl:max-w-[720px] ${
          mobileView === "map" ? "hidden md:block" : "block"
        }`}
      >
        <BraiderList
          items={items}
          pagination={pagination}
          hasError={hasError}
          locationLabel={locationLabel}
          hoveredId={hoveredId}
          activeId={activeId}
          onHover={setHoveredId}
          onSelect={handleSelect}
          onChangePage={handleChangePage}
          isPending={isPending}
          dict={dict}
        />
      </div>

      <div
        className={`relative flex-1 ${
          mobileView === "list"
            ? "hidden md:block"
            : "block h-[calc(100dvh-12.5rem)] md:h-auto"
        }`}
      >
        <BraiderMap
          items={items}
          center={center}
          hoveredId={hoveredId}
          activeId={activeId}
          onHoverPin={setHoveredId}
          onSelectPin={handleSelect}
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
