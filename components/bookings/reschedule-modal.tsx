"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { DayPicker } from "react-day-picker";
import { enUS, fr, de } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { bookingsApi } from "@/lib/api/bookings-client";
import { braidersApi } from "@/lib/api/braiders-client";
import type { AvailableSlotResponse, BookingResponse } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { BookingDetailDict } from "@/components/bookings/types";
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

const localeMap = { en: enUS, fr, de };
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

export function RescheduleModal({
  isOpen,
  onClose,
  booking,
  accessToken,
  lang,
  dict,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingResponse | null;
  accessToken: string;
  lang: Locale;
  dict: BookingDetailDict;
}) {
  const queryClient = useQueryClient();
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const maxMonth = useMemo(() => addMonths(startOfMonth(today), MAX_MONTHS_AHEAD), [today]);

  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMonth(startOfMonth(today));
      setSelectedDate(today);
      setSelectedSlot(null);
    }
  }, [isOpen, today]);

  const rangeStart = month < today ? today : month;
  const dateFrom = toISODateLocal(rangeStart);
  const dateTo = toISODateLocal(endOfMonth(month));

  const {
    data: slots,
    isLoading,
    isError,
  } = useQuery<AvailableSlotResponse[], ApiError>({
    queryKey: [
      "braider-availability",
      booking?.braider_id,
      booking?.style_id,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      braidersApi.getAvailabilitySlots(
        booking!.braider_id,
        {
          style_id: booking!.style_id,
          date_from: dateFrom,
          date_to: dateTo,
        },
        lang
      ),
    enabled: isOpen && !!booking,
  });

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
    setSelectedSlot(null);
  }

  function handleSelectDay(date: Date | undefined) {
    if (!date) return;
    setSelectedDate(date);
    setSelectedSlot(null);
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

  const mutation = useMutation({
    mutationFn: () => {
      if (!selectedSlot || !booking) return Promise.reject(new Error("Missing data"));
      return bookingsApi.reschedule(
        accessToken,
        lang,
        booking.id,
        selectedSlot.start_at
      );
    },
    onSuccess: (updatedBooking) => {
      queryClient.setQueryData(["booking", updatedBooking.id], updatedBooking);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success(dict.rescheduleSuccess);
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiError) {
        toast.error(err.message || dict.rescheduleError);
      } else {
        toast.error(dict.rescheduleError);
      }
    },
  });

  if (!booking) return null;

  return (
    <Modal open={isOpen} onClose={onClose} labelledBy="reschedule-modal-title" size="lg">
      <div className="flex flex-col gap-6">
        <div>
          <h2 id="reschedule-modal-title" className="text-xl font-semibold text-foreground">
            {dict.rescheduleTitle}
          </h2>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-foreground capitalize">
                {monthLabel}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => handleMonthChange(addMonths(month, -1))}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-border/40 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
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

          <div className="flex min-w-0 flex-1 flex-col gap-3 border-t border-border pt-4 md:border-t-0 md:border-l md:pl-8 md:pt-0">
            <span className="text-sm font-semibold text-foreground capitalize">
              {selectedDateLabel}
            </span>

            {isError && (
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted-foreground">{dict.rescheduleLoadError}</p>
              </div>
            )}
            {isLoading && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-20 animate-pulse rounded-full bg-border/50"
                  />
                ))}
              </div>
            )}
            {!isLoading && !isError && slotsForSelectedDay.length === 0 && (
              <p className="text-sm text-muted-foreground">{dict.rescheduleNoSlots}</p>
            )}
            {!isLoading && !isError && slotsForSelectedDay.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {slotsForSelectedDay.map((slot) => {
                  const isSelected = selectedSlot?.start_at === slot.start_at;
                  return (
                    <button
                      key={slot.start_at}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
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

        <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {dict.rescheduleCancel}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !selectedSlot}
          >
            {mutation.isPending ? "..." : dict.rescheduleConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
