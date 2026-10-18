"use client";

import { Map as MapIcon, List } from "lucide-react";
import type { SearchResultsDict } from "@/components/search-results/types";

export function MobileViewToggle({
  view,
  onToggle,
  dict,
}: {
  view: "list" | "map";
  onToggle: () => void;
  dict: SearchResultsDict;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="search-pop-in fixed bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-8 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-xl transition-transform active:scale-95 lg:hidden"
    >
      {view === "list" ? (
        <>
          <MapIcon className="size-4" />
          {dict.showMap}
        </>
      ) : (
        <>
          <List className="size-4" />
          {dict.showList}
        </>
      )}
    </button>
  );
}
