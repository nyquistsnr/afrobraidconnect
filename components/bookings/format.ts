import type { Locale } from "@/lib/i18n";
import { formatTemplate } from "@/lib/format-template";
import type { BookingDetailDict } from "@/components/bookings/types";

function toISODateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// "Upcoming"/"Past" tab filters compare against the browser's local
// calendar day, matching how the rest of the app's date pickers reason
// about "today" — the API's date_from/date_to bounds are whole UTC days,
// but that's a day-level filter, not a precision guarantee this needs.
export function todayISODate(): string {
  return toISODateLocal(new Date());
}

export function yesterdayISODate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toISODateLocal(d);
}

export function formatBookingDateTime(iso: string, lang: Locale): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat(lang, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(lang, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${datePart} · ${timePart}`;
}

export function formatBookingDateOnly(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatBookingDuration(
  totalMinutes: number,
  dict: BookingDetailDict
): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return formatTemplate(dict.durationMinutes, { minutes: totalMinutes });
  if (minutes === 0) return formatTemplate(dict.durationHours, { hours });
  return formatTemplate(dict.durationHoursMinutes, { hours, minutes });
}
