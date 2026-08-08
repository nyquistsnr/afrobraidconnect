// Bridges the header search bar's UI state (SelectedLocation/SelectedStyle/
// SelectedDateRange) and the /search route's URL query string. Isomorphic —
// buildSearchHref runs client-side (router.push from the search bar),
// parseSearchParams runs server-side (the /search page reading searchParams).
import type {
  SelectedDateRange,
  SelectedLocation,
  SelectedStyle,
} from "@/components/search/types";
import type { BraiderSearchParams } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";

export interface SearchQueryState {
  location: SelectedLocation | null;
  style: SelectedStyle | null;
  dateRange: SelectedDateRange;
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISODate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function buildSearchHref(lang: Locale, state: SearchQueryState): string {
  const params = new URLSearchParams();
  const { location, style, dateRange } = state;

  if (location?.label) params.set("location", location.label);
  if (location?.lat != null && location?.lng != null) {
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
  } else if (location?.countryCode) {
    params.set("country_code", location.countryCode);
  }

  if (style?.id) {
    params.set("style_id", style.id);
    params.set("style_name", style.name);
  }

  if (dateRange.from) {
    params.set("date_from", toISODate(dateRange.from));
    params.set("date_to", toISODate(dateRange.to ?? dateRange.from));
  }

  const qs = params.toString();
  return `/${lang}/search${qs ? `?${qs}` : ""}`;
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): {
  ui: SearchQueryState;
  api: BraiderSearchParams;
  page: number;
} {
  const location = first(searchParams.location);
  const lat = first(searchParams.lat);
  const lng = first(searchParams.lng);
  const countryCode = first(searchParams.country_code);
  const styleId = first(searchParams.style_id);
  const styleName = first(searchParams.style_name);
  const dateFrom = first(searchParams.date_from);
  const dateTo = first(searchParams.date_to);
  const page = Number(first(searchParams.page)) || 1;

  const parsedLat = lat ? Number(lat) : undefined;
  const parsedLng = lng ? Number(lng) : undefined;
  const hasCoords =
    parsedLat != null &&
    !Number.isNaN(parsedLat) &&
    parsedLng != null &&
    !Number.isNaN(parsedLng);

  const ui: SearchQueryState = {
    location: location
      ? {
          label: location,
          lat: hasCoords ? parsedLat : undefined,
          lng: hasCoords ? parsedLng : undefined,
          countryCode: countryCode || undefined,
        }
      : null,
    style: styleId ? { id: styleId, name: styleName ?? "" } : null,
    dateRange: {
      from: dateFrom ? fromISODate(dateFrom) : undefined,
      to: dateTo ? fromISODate(dateTo) : undefined,
    },
  };

  const api: BraiderSearchParams = {
    lat: hasCoords ? parsedLat : undefined,
    lng: hasCoords ? parsedLng : undefined,
    country_code: !hasCoords && countryCode ? countryCode : undefined,
    style_id: styleId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
  };

  return { ui, api, page };
}
