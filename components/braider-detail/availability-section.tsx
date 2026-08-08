"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { enUS, fr, de } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailableSlotResponse, BraiderOfferedStyle } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { braidersApi } from "@/lib/api/braiders-client";
import { ApiError } from "@/lib/api/auth-client";
import {
  addMonths,
  endOfMonth,
  formatSlotTime,
  isSameLocalDay,
  isSameLocalMonth,
  localDateKey,
  startOfLocalDay,
  startOfMonth,
  toISODateLocal,
} from "@/components/braider-detail/format";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

const localeMap = { en: enUS, fr, de };

// How far ahead the customer can page the calendar. The public slots
// endpoint silently narrows/empties an out-of-range request rather than
// erroring, so this is just a sane UI bound, not a guess at the braider's
// actual max_advance_days (that setting isn't exposed publicly).
const MAX_MONTHS_AHEAD = 3;

const dayClassNames = {
  month: "flex flex-1 flex-col gap-3",
  month_caption: "sr-only",
  month_grid: "w-full border-collapse",
  weekdays: "",
  weekday:
    "w-9 pb-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
  week: "",
  day: "relative p-0 text-center align-middle text-sm [&>button]:flex [&>button]:size-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:font-medium [&>button]:text-foreground [&>button]:transition-colors [&>button]:hover:bg-border/60",
  today: "[&>button]:border [&>button]:border-foreground/60",
  selected:
    "[&>button]:bg-brand [&>button]:text-brand-foreground [&>button]:hover:bg-brand",
  disabled:
    "[&>button]:pointer-events-none [&>button]:text-placeholder [&>button]:opacity-40 [&>button]:hover:bg-transparent",
  outside: "[&>button]:pointer-events-none [&>button]:invisible",
  hidden: "invisible",
};

const modifiersClassNames = {
  available:
    "after:absolute after:bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-brand after:content-['']",
};

export function AvailabilitySection({
  braiderId,
  style,
  lang,
  selectedSlot,
  onSelectSlot,
  initialDate,
  dict,
}: {
  braiderId: string;
  style: BraiderOfferedStyle;
  lang: Locale;
  selectedSlot: AvailableSlotResponse | null;
  onSelectSlot: (slot: AvailableSlotResponse | null) => void;
  initialDate?: Date | null;
  dict: BraiderDetailDict;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const maxMonth = useMemo(
    () => addMonths(startOfMonth(today), MAX_MONTHS_AHEAD),
    [today]
  );

  const hasDuration = style.duration_minutes != null;

  // A date carried in from the search bar (or a previously edited/shared
  // link) only makes sense if it still falls within the bookable window —
  // a stale or out-of-range link just falls back to today rather than
  // landing the customer on a calendar page they can't interact with.
  const clampedInitialDate = useMemo(() => {
    if (!initialDate) return today;
    const day = startOfLocalDay(initialDate);
    if (day < today || day > endOfMonth(maxMonth)) return today;
    return day;
  }, [initialDate, today, maxMonth]);

  const [month, setMonth] = useState(() => startOfMonth(clampedInitialDate));
  const [selectedDate, setSelectedDate] = useState(clampedInitialDate);

  // Keeps the customer's chosen day retrievable on refresh/back-nav/shared
  // links — merges into whatever else is already on the URL (e.g. style_id)
  // rather than clobbering it, and replaces instead of pushing so paging
  // through months doesn't pile up history entries.
  function syncDateParam(date: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date_from", toISODateLocal(date));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const rangeStart = month < today ? today : month;
  const dateFrom = toISODateLocal(rangeStart);
  const dateTo = toISODateLocal(endOfMonth(month));

  const {
    data: slots,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AvailableSlotResponse[], ApiError>({
    queryKey: ["braider-availability", braiderId, style.style_id, dateFrom, dateTo],
    queryFn: () =>
      braidersApi.getAvailabilitySlots(braiderId, {
        style_id: style.style_id,
        date_from: dateFrom,
        date_to: dateTo,
      }),
    enabled: hasDuration,
  });

  const notConfigured =
    isError && error instanceof ApiError && error.code === "AVAILABILITY_SETTINGS_NOT_CONFIGURED";

  // The selected day already renders as a filled circle — skip its dot so
  // the two indicators don't visually collide.
  const availableDates = useMemo(() => {
    if (!slots) return [];
    const keys = new Set(slots.map((slot) => localDateKey(slot.start_at)));
    keys.delete(toISODateLocal(selectedDate));
    return [...keys].map((key) => new Date(`${key}T00:00:00`));
  }, [slots, selectedDate]);

  const slotsForSelectedDay = useMemo(
    () =>
      (slots ?? []).filter((slot) =>
        isSameLocalDay(new Date(slot.start_at), selectedDate)
      ),
    [slots, selectedDate]
  );

  function handleMonthChange(nextMonth: Date) {
    const start = startOfMonth(nextMonth);
    const nextSelectedDate = start < today ? today : start;
    setMonth(start);
    setSelectedDate(nextSelectedDate);
    syncDateParam(nextSelectedDate);
    onSelectSlot(null);
  }

  function handleSelectDay(date: Date | undefined) {
    if (!date) return;
    setSelectedDate(date);
    syncDateParam(date);
    onSelectSlot(null);
  }

  function handleSelectSlot(slot: AvailableSlotResponse) {
    onSelectSlot(selectedSlot?.start_at === slot.start_at ? null : slot);
  }

  const canGoPrev = !isSameLocalMonth(month, today);
  const canGoNext = !isSameLocalMonth(month, maxMonth);

  const monthLabel = new Intl.DateTimeFormat(lang, {
    month: "long",
    year: "numeric",
  }).format(month);
  const selectedDateLabel = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(selectedDate);

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground">{dict.availability.title}</h2>

      <div className="flex flex-col gap-6 rounded-2xl border border-border/70 p-4 sm:p-5 md:flex-row md:gap-8">
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-foreground capitalize">
              {monthLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={dict.availability.previousMonth}
                disabled={!canGoPrev}
                onClick={() => handleMonthChange(addMonths(month, -1))}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-border/40 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label={dict.availability.nextMonth}
                disabled={!canGoNext}
                onClick={() => handleMonthChange(addMonths(month, 1))}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-border/40 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <DayPicker
            mode="single"
            month={month}
            onMonthChange={handleMonthChange}
            startMonth={today}
            endMonth={maxMonth}
            hideNavigation
            showOutsideDays={false}
            disabled={{ before: today }}
            selected={selectedDate}
            onSelect={handleSelectDay}
            locale={localeMap[lang]}
            modifiers={{ available: availableDates }}
            modifiersClassNames={modifiersClassNames}
            classNames={dayClassNames}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <span className="text-sm font-semibold text-foreground capitalize">
            {selectedDateLabel}
          </span>

          {!hasDuration && (
            <p className="text-sm text-muted-foreground">{dict.availability.noDuration}</p>
          )}
          {hasDuration && isError && notConfigured && (
            <p className="text-sm text-muted-foreground">{dict.availability.notConfigured}</p>
          )}
          {hasDuration && isError && !notConfigured && (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">{dict.availability.loadError}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-sm font-semibold text-foreground underline underline-offset-2"
              >
                {dict.availability.retry}
              </button>
            </div>
          )}
          {hasDuration && isLoading && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-20 animate-pulse rounded-full bg-border/50"
                />
              ))}
            </div>
          )}
          {hasDuration && !isLoading && !isError && slotsForSelectedDay.length === 0 && (
            <p className="text-sm text-muted-foreground">{dict.availability.noSlotsForDay}</p>
          )}
          {hasDuration && !isLoading && !isError && slotsForSelectedDay.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slotsForSelectedDay.map((slot) => {
                const isSelected = selectedSlot?.start_at === slot.start_at;
                return (
                  <button
                    key={slot.start_at}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    aria-pressed={isSelected}
                    className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:bg-border/40"
                    }`}
                  >
                    {formatSlotTime(slot.start_at, lang)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
