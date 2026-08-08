"use client";

import { useMemo, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { enUS, fr, de } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { SelectedDateRange, WhenPanelDict } from "@/components/search/types";

const localeMap = { en: enUS, fr, de };

// Mobile shows a year's worth of months stacked in one scrollable column
// (like Airbnb's mobile calendar — scroll instead of paging), while desktop
// pages two months at a time with chevrons.
const SCROLL_MONTHS_AHEAD = 12;

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Every DayPicker className below styles the `day` (table cell), the only
// element that receives modifier-specific classes — see getClassNamesForModifiers
// in react-day-picker. We reach into its child `day_button` via `[&>button]`
// so a range can render as a continuous brand-tinted band with solid circular
// caps at the start/end, matching Airbnb's calendar.
const baseClassNames = {
  month: "flex flex-1 flex-col gap-4",
  month_caption: "flex h-8 items-center justify-center",
  caption_label: "text-sm font-semibold text-foreground",
  month_grid: "w-full border-collapse",
  weekdays: "",
  weekday:
    "w-10 pb-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
  week: "",
  day: "relative p-0 text-center align-middle text-sm [&>button]:flex [&>button]:size-10 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:font-medium [&>button]:text-foreground [&>button]:transition-colors [&>button]:hover:bg-border/60",
  today: "[&>button]:border [&>button]:border-foreground/60",
  selected:
    "[&>button]:bg-brand [&>button]:text-brand-foreground [&>button]:hover:bg-brand",
  range_start:
    "rounded-l-full bg-brand/15 [&>button]:bg-brand [&>button]:text-brand-foreground [&>button]:hover:bg-brand",
  range_end:
    "rounded-r-full bg-brand/15 [&>button]:bg-brand [&>button]:text-brand-foreground [&>button]:hover:bg-brand",
  range_middle:
    "bg-brand/15 [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-foreground [&>button]:hover:bg-transparent",
  outside: "[&>button]:pointer-events-none [&>button]:invisible",
  disabled:
    "[&>button]:pointer-events-none [&>button]:text-placeholder [&>button]:opacity-40 [&>button]:hover:bg-transparent",
  hidden: "invisible",
};

export function CalendarPanel({
  value,
  onChange,
  onClear,
  onClose,
  lang,
  layout,
  dict,
}: {
  value: SelectedDateRange;
  onChange: (range: SelectedDateRange) => void;
  onClear: () => void;
  onClose: () => void;
  lang: Locale;
  layout: "paged" | "scroll";
  dict: WhenPanelDict;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const endMonth = useMemo(() => addMonths(today, 24), [today]);
  const [month, setMonth] = useState(() => addMonths(today, 0));

  const canGoPrev = !isSameMonth(month, today);
  const rightmostMonth = addMonths(month, 1);
  const canGoNext = !isSameMonth(rightmostMonth, endMonth);

  const selected: DateRange | undefined = value.from
    ? { from: value.from, to: value.to }
    : undefined;

  const classNames = {
    ...baseClassNames,
    months:
      layout === "scroll"
        ? "flex flex-col gap-8"
        : "flex flex-col gap-8 sm:flex-row sm:gap-10",
  };

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {dict.heading}
        </h3>
        {layout === "paged" ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canGoPrev}
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-border/40 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={!canGoNext}
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-border/40 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClear}
            disabled={!value.from}
            className="text-sm font-semibold text-foreground underline underline-offset-2 disabled:pointer-events-none disabled:opacity-40"
          >
            {dict.clearDates}
          </button>
        )}
      </div>

      {layout === "paged" ? (
        <DayPicker
          mode="range"
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          startMonth={today}
          endMonth={endMonth}
          hideNavigation
          showOutsideDays={false}
          disabled={{ before: today }}
          selected={selected}
          onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
          locale={localeMap[lang]}
          classNames={classNames}
        />
      ) : (
        <DayPicker
          mode="range"
          defaultMonth={today}
          numberOfMonths={SCROLL_MONTHS_AHEAD}
          startMonth={today}
          endMonth={endMonth}
          hideNavigation
          showOutsideDays={false}
          disabled={{ before: today }}
          selected={selected}
          onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
          locale={localeMap[lang]}
          classNames={classNames}
        />
      )}

      {layout === "paged" && (
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={onClear}
            disabled={!value.from}
            className="text-sm font-semibold text-foreground underline underline-offset-2 transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-40"
          >
            {dict.clearDates}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            {dict.closeCalendar}
          </button>
        </div>
      )}
    </div>
  );
}
