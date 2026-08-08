"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { WherePanel } from "@/components/search/where-panel";
import { StylePanel } from "@/components/search/style-panel";
import { CalendarPanel } from "@/components/search/calendar-panel";
import type {
  SearchPanelKey,
  SelectedLocation,
  SelectedStyle,
  SelectedDateRange,
  SearchDict,
} from "@/components/search/types";

export interface SearchBarDict {
  searchLocationLabel: string;
  searchLocationPlaceholder: string;
  searchStyleLabel: string;
  searchStylePlaceholder: string;
  searchDateLabel: string;
  searchDatePlaceholder: string;
  startSearch: string;
  searchButtonLabel: string;
  search: SearchDict;
}

function formatDateRange(range: SelectedDateRange, lang: Locale): string | null {
  if (!range.from) return null;
  const fmt = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" });
  if (!range.to || range.to.getTime() === range.from.getTime()) {
    return fmt.format(range.from);
  }
  return `${fmt.format(range.from)} – ${fmt.format(range.to)}`;
}

const panelWidth: Record<SearchPanelKey, string> = {
  where: "w-[420px]",
  style: "w-[440px]",
  when: "w-auto",
};

export function SearchBar({
  lang,
  scrolled,
  dict,
  location,
  onLocationChange,
  style,
  onStyleChange,
  dateRange,
  onDateRangeChange,
}: {
  lang: Locale;
  scrolled: boolean;
  dict: SearchBarDict;
  location: SelectedLocation | null;
  onLocationChange: (location: SelectedLocation | null) => void;
  style: SelectedStyle | null;
  onStyleChange: (style: SelectedStyle | null) => void;
  dateRange: SelectedDateRange;
  onDateRangeChange: (range: SelectedDateRange) => void;
}) {
  const [activePanel, setActivePanel] = useState<SearchPanelKey | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const expanded = !scrolled || activePanel !== null;

  useEffect(() => {
    if (!activePanel) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActivePanel(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel]);

  function toggle(panel: SearchPanelKey) {
    setActivePanel((current) => (current === panel ? null : panel));
  }

  const dateLabel = formatDateRange(dateRange, lang);

  return (
    <div
      ref={containerRef}
      className="relative hidden min-w-0 flex-1 justify-center md:flex"
    >
      {activePanel && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setActivePanel(null)}
          aria-hidden
        />
      )}

      <div className="relative w-full min-w-0 max-w-[680px]">
        {!expanded ? (
          <button
            type="button"
            onClick={() => setActivePanel("where")}
            className="search-fade-in relative z-50 mx-auto flex w-fit h-12 items-center gap-3 rounded-full border border-border bg-surface px-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Search className="size-4" />
            </span>
            <span className="text-sm font-medium text-foreground">
              {dict.startSearch}
            </span>
          </button>
        ) : (
          <div className="search-fade-in relative z-50 flex h-16 items-center rounded-full border border-border bg-surface shadow-sm">
            <button
              type="button"
              onClick={() => toggle("where")}
              aria-expanded={activePanel === "where"}
              className={`relative flex h-full flex-1 min-w-0 items-center rounded-full px-4 lg:px-8 text-left transition-all duration-200 ${
                activePanel === "where"
                  ? "z-10 bg-surface shadow-[0_3px_12px_rgba(0,0,0,0.15)] ring-1 ring-border"
                  : "hover:bg-border/40"
              }`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-semibold text-foreground">
                  {dict.searchLocationLabel}
                </span>
                <span className="block max-w-full truncate text-xs text-muted-foreground lg:max-w-[190px]">
                  {location?.label ?? dict.searchLocationPlaceholder}
                </span>
              </span>
            </button>

            <span
              className={`h-8 w-px bg-border transition-opacity ${
                activePanel === "where" || activePanel === "style"
                  ? "opacity-0"
                  : "opacity-100"
              }`}
            />

            <button
              type="button"
              onClick={() => toggle("style")}
              aria-expanded={activePanel === "style"}
              className={`relative flex h-full flex-1 min-w-0 items-center rounded-full px-4 lg:px-8 text-left transition-all duration-200 ${
                activePanel === "style"
                  ? "z-10 bg-surface shadow-[0_3px_12px_rgba(0,0,0,0.15)] ring-1 ring-border"
                  : "hover:bg-border/40"
              }`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-semibold text-foreground">
                  {dict.searchStyleLabel}
                </span>
                <span className="block max-w-full truncate text-xs text-muted-foreground lg:max-w-[170px]">
                  {style?.name ?? dict.searchStylePlaceholder}
                </span>
              </span>
            </button>

            <span
              className={`h-8 w-px bg-border transition-opacity ${
                activePanel === "style" || activePanel === "when"
                  ? "opacity-0"
                  : "opacity-100"
              }`}
            />

            <button
              type="button"
              onClick={() => toggle("when")}
              aria-expanded={activePanel === "when"}
              className={`relative flex h-full flex-[1.2] min-w-0 items-center rounded-full py-2 pr-2 pl-4 lg:pl-8 text-left transition-all duration-200 ${
                activePanel === "when"
                  ? "z-10 bg-surface shadow-[0_3px_12px_rgba(0,0,0,0.15)] ring-1 ring-border"
                  : "hover:bg-border/40"
              }`}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-foreground">
                  {dict.searchDateLabel}
                </span>
                <span className="block max-w-full truncate text-xs text-muted-foreground lg:max-w-[160px]">
                  {dateLabel ?? dict.searchDatePlaceholder}
                </span>
              </span>
              <span className="ml-2 lg:ml-3 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Search className="size-4" />
              </span>
            </button>
          </div>
        )}

        {activePanel && (
          <div
            key={activePanel}
            className={`search-panel-in absolute top-full left-1/2 z-50 mt-3 -translate-x-1/2 rounded-3xl border border-border bg-surface p-6 shadow-2xl ${panelWidth[activePanel]}`}
          >
            {activePanel === "where" && (
              <WherePanel
                initialQuery={location?.label ?? ""}
                onSelect={(loc) => {
                  onLocationChange(loc);
                  setActivePanel("style");
                }}
                selectedLabel={location?.label}
                selectedIsNearby={location?.isNearby}
                dict={dict.search.where}
              />
            )}
            {activePanel === "style" && (
              <StylePanel
                lang={lang}
                onSelect={(s) => {
                  onStyleChange(s);
                  setActivePanel("when");
                }}
                selectedStyle={style}
                dict={dict.search.style}
              />
            )}
            {activePanel === "when" && (
              <CalendarPanel
                value={dateRange}
                onChange={onDateRangeChange}
                onClear={() => onDateRangeChange({})}
                onClose={() => setActivePanel(null)}
                lang={lang}
                layout="paged"
                dict={dict.search.when}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
