import type { AvailableSlotResponse, BraiderOfferedStyle } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { formatTemplate } from "@/lib/format-template";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function formatDuration(
  totalMinutes: number,
  dict: BraiderDetailDict
): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return formatTemplate(dict.durationMinutes, { minutes: totalMinutes });
  }
  if (minutes === 0) {
    return formatTemplate(dict.durationHours, { hours });
  }
  return formatTemplate(dict.durationHoursMinutes, { hours, minutes });
}

// Base/variation price plus every required addon and any optional addons
// the customer has picked — the sidebar's running estimate.
export function calcEstimatedTotal(
  style: BraiderOfferedStyle,
  selectedVariationId: string | null,
  selectedAddonIds: ReadonlySet<string>
): number {
  const variation = style.variations.find((v) => v.id === selectedVariationId);
  const base = variation ? Number(variation.price) : Number(style.base_price);
  const addonsTotal = style.addons
    .filter((addon) => addon.is_required || selectedAddonIds.has(addon.id))
    .reduce((sum, addon) => sum + Number(addon.price), 0);
  return base + addonsTotal;
}

// ---------------------------------------------------------------------------
// Availability calendar — everything here operates on the browser's local
// calendar/clock, matching how the customer reads the picker. The API takes
// plain dates and returns UTC instants; converting a slot's start_at with a
// plain `new Date(...)` already renders it in local time via Intl/getters.
// ---------------------------------------------------------------------------

export function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = startOfLocalDay(date);
  d.setDate(1);
  return d;
}

export function addMonths(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + amount);
  return d;
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function endOfMonth(date: Date): Date {
  return addDays(addMonths(startOfMonth(date), 1), -1);
}

export function isSameLocalMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return toISODateLocal(a) === toISODateLocal(b);
}

export function toISODateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Buckets a UTC slot instant by the local calendar day the customer sees it
// fall on.
export function localDateKey(iso: string): string {
  return toISODateLocal(new Date(iso));
}

export function formatSlotTime(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatSlotDateTime(iso: string, lang: Locale): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat(lang, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
  return `${datePart} · ${formatSlotTime(iso, lang)}`;
}

// Shared between the desktop sidebar and the mobile booking bar so their CTA
// copy stays in sync as a chosen time slot is added to the selection.
export function ctaLabel(
  dict: BraiderDetailDict,
  hasStyle: boolean,
  hasSlot: boolean
): string {
  if (!hasStyle) return dict.sidebar.ctaNoSelection;
  return hasSlot ? dict.sidebar.ctaWithSlot : dict.sidebar.cta;
}

export function comingSoonMessage(
  dict: BraiderDetailDict,
  slot: AvailableSlotResponse | null,
  lang: Locale
): string {
  if (!slot) return dict.sidebar.comingSoonToast;
  return formatTemplate(dict.sidebar.comingSoonToastWithTime, {
    time: formatSlotDateTime(slot.start_at, lang),
  });
}
