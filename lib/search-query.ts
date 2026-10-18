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
  radiusKm?: number;
}

// Results-page-only refinements (the filter chips above the list) — kept out
// of SearchQueryState since the header search bar never sets them.
export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  mobileOnly?: boolean;
}

// Wide enough that a city search usually finds someone (5km routinely came
// back empty), narrow enough that results stay a realistic trip away.
export const DEFAULT_RADIUS_KM = 25;
export const RADIUS_PRESETS_KM = [5, 10, 25, 50, 100] as const;
export const MAX_RADIUS_KM = 100;

// The subset of the /search URL's own query params (location/date/radius —
// not style, which is per-braider-card via matched_style) that should carry
// over onto a braider profile link, so the header search bar there reflects
// the same search the customer was already doing instead of resetting.
export interface SearchLinkContext {
  location: string | null;
  lat: string | null;
  lng: string | null;
  country_code: string | null;
  date_from: string | null;
  date_to: string | null;
  radius_km: string | null;
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

function positiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : undefined;
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
    if (style.imageUrl) {
      params.set("style_image_url", style.imageUrl);
    }
  }

  if (dateRange.from) {
    params.set("date_from", toISODate(dateRange.from));
    params.set("date_to", toISODate(dateRange.to ?? dateRange.from));
  }

  if (state.radiusKm) {
    params.set("radius_km", String(state.radiusKm));
  }

  const qs = params.toString();
  return `/${lang}/search${qs ? `?${qs}` : ""}`;
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): {
  ui: SearchQueryState;
  filters: SearchFilters;
  api: BraiderSearchParams;
  page: number;
} {
  const location = first(searchParams.location);
  const lat = first(searchParams.lat);
  const lng = first(searchParams.lng);
  const countryCode = first(searchParams.country_code);
  const styleId = first(searchParams.style_id);
  const styleName = first(searchParams.style_name);
  const styleImageUrl = first(searchParams.style_image_url);
  const dateFrom = first(searchParams.date_from);
  const dateTo = first(searchParams.date_to);
  const radiusKmStr = first(searchParams.radius_km);
  const page = Number(first(searchParams.page)) || 1;
  const filters: SearchFilters = {
    minPrice: positiveNumber(first(searchParams.min_price)),
    maxPrice: positiveNumber(first(searchParams.max_price)),
    minRating: positiveNumber(first(searchParams.min_rating)),
    mobileOnly: first(searchParams.mobile) === "1" || undefined,
  };

  const parsedLat = lat ? Number(lat) : undefined;
  const parsedLng = lng ? Number(lng) : undefined;
  const hasCoords =
    parsedLat != null &&
    !Number.isNaN(parsedLat) &&
    parsedLng != null &&
    !Number.isNaN(parsedLng);
    
  const radiusKm = Math.min(positiveNumber(radiusKmStr) ?? DEFAULT_RADIUS_KM, MAX_RADIUS_KM);

  const ui: SearchQueryState = {
    location: location
      ? {
          label: location,
          lat: hasCoords ? parsedLat : undefined,
          lng: hasCoords ? parsedLng : undefined,
          countryCode: countryCode || undefined,
        }
      : null,
    style: styleId ? { id: styleId, name: styleName ?? "", imageUrl: styleImageUrl } : null,
    dateRange: {
      from: dateFrom ? fromISODate(dateFrom) : undefined,
      to: dateTo ? fromISODate(dateTo) : undefined,
    },
    radiusKm,
  };

  const api: BraiderSearchParams = {
    lat: hasCoords ? parsedLat : undefined,
    lng: hasCoords ? parsedLng : undefined,
    country_code: !hasCoords && countryCode ? countryCode : undefined,
    style_id: styleId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    radius_km: hasCoords ? radiusKm : undefined,
    min_amount: filters.minPrice,
    max_amount: filters.maxPrice,
    min_rate: filters.minRating,
    is_mobile: filters.mobileOnly,
    page,
  };

  return { ui, filters, api, page };
}

// Stable cache key for a search — the server page and the client results
// view both derive it from the same URL, so the server-fetched first page
// can seed the client cache without a duplicate request.
export function searchCacheKey(api: BraiderSearchParams): string {
  return JSON.stringify(
    Object.entries(api)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}
