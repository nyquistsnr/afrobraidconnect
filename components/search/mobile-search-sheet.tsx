"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Sparkles, Calendar, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { buildSearchHref } from "@/lib/search-query";
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

export interface MobileSearchDict {
  searchLocationLabel: string;
  searchStyleLabel: string;
  searchDateLabel: string;
  startSearch: string;
  searchButtonLabel: string;
  closeLabel: string;
  clearAllLabel: string;
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

export function MobileSearch({
  lang,
  dict,
  location,
  onLocationChange,
  style,
  onStyleChange,
  dateRange,
  onDateRangeChange,
}: {
  lang: Locale;
  dict: MobileSearchDict;
  location: SelectedLocation | null;
  onLocationChange: (location: SelectedLocation | null) => void;
  style: SelectedStyle | null;
  onStyleChange: (style: SelectedStyle | null) => void;
  dateRange: SelectedDateRange;
  onDateRangeChange: (range: SelectedDateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SearchPanelKey>("where");
  const router = useRouter();

  function handleSearch() {
    setOpen(false);
    router.push(buildSearchHref(lang, { location, style, dateRange }));
  }

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const dateLabel = formatDateRange(dateRange, lang);
  const hasSelection = Boolean(location || style || dateRange.from);

  const tabs: { key: SearchPanelKey; label: string; icon: typeof MapPin; filled: boolean }[] = [
    { key: "where", label: dict.searchLocationLabel, icon: MapPin, filled: Boolean(location) },
    { key: "style", label: dict.searchStyleLabel, icon: Sparkles, filled: Boolean(style) },
    { key: "when", label: dict.searchDateLabel, icon: Calendar, filled: Boolean(dateRange.from) },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTab("where");
          setOpen(true);
        }}
        className="flex w-full items-center gap-3 rounded-full border border-border bg-surface px-4 py-3 shadow-sm"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <Search className="size-4" />
        </span>
        <span className="flex flex-col text-left">
          <span className="text-sm font-semibold text-foreground">
            {location?.label ?? dict.searchLocationLabel}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {[style?.name, dateLabel].filter(Boolean).join(" · ") ||
              dict.startSearch}
          </span>
        </span>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex flex-col bg-surface">
            <div className="search-sheet-in flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={dict.closeLabel}
                  className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-border/40"
                >
                  <X className="size-5" />
                </button>
                <span className="text-sm font-semibold text-foreground">
                  {dict.startSearch}
                </span>
                <span className="size-9" />
              </div>

              <div className="flex gap-2 border-b border-border px-4 py-3">
                {tabs.map(({ key, label, icon: Icon, filled }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                      tab === key
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:bg-border/40"
                    }`}
                  >
                    {filled ? (
                      <Check className="size-3.5" strokeWidth={3} />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div key={tab} className="search-panel-in">
                  {tab === "where" && (
                    <WherePanel
                      initialQuery={location?.label ?? ""}
                      onSelect={(loc) => {
                        onLocationChange(loc);
                        setTab("style");
                      }}
                      selectedLabel={location?.label}
                      selectedIsNearby={location?.isNearby}
                      dict={dict.search.where}
                    />
                  )}
                  {tab === "style" && (
                    <StylePanel
                      lang={lang}
                      onSelect={(s) => {
                        onStyleChange(s);
                        setTab("when");
                      }}
                      selectedStyle={style}
                      dict={dict.search.style}
                    />
                  )}
                  {tab === "when" && (
                    <CalendarPanel
                      value={dateRange}
                      onChange={onDateRangeChange}
                      onClear={() => onDateRangeChange({})}
                      onClose={() => setOpen(false)}
                      lang={lang}
                      layout="scroll"
                      dict={dict.search.when}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <button
                  type="button"
                  disabled={!hasSelection}
                  onClick={() => {
                    onLocationChange(null);
                    onStyleChange(null);
                    onDateRangeChange({});
                  }}
                  className="text-sm font-semibold text-foreground underline underline-offset-2 disabled:pointer-events-none disabled:opacity-40"
                >
                  {dict.clearAllLabel}
                </button>
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
                >
                  <Search className="size-4" />
                  {dict.searchButtonLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
