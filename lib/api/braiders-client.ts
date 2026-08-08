// Public braider discovery endpoints — no auth required. Responses are
// locale-resolved server-side via Accept-Language (default "en").
import type {
  ApiEnvelope,
  AvailableSlotResponse,
  BraiderDetailResponse,
  BraiderSearchItem,
  BraiderSearchParams,
  PaginatedData,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function get<TRes>(path: string, lang?: Locale): Promise<TRes> {
  if (!API_BASE) {
    throw new ApiError(
      "API_BASE_NOT_CONFIGURED",
      "NEXT_PUBLIC_API_BASE_URL is not set.",
      500
    );
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: lang ? { "Accept-Language": lang } : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
  }

  const json: ApiEnvelope<TRes> = await res.json();

  if (json.status === "error" || !json.data) {
    const error = json.error ?? {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong.",
    };
    throw new ApiError(error.code, error.message, res.status, error.details);
  }

  return json.data;
}

export const braidersApi = {
  search: (params: BraiderSearchParams = {}, lang?: Locale) => {
    const query = new URLSearchParams();
    if (params.lat != null) query.set("lat", String(params.lat));
    if (params.lng != null) query.set("lng", String(params.lng));
    if (params.radius_km != null)
      query.set("radius_km", String(params.radius_km));
    if (params.style_id) query.set("style_id", params.style_id);
    if (params.style_slug) query.set("style_slug", params.style_slug);
    if (params.search) query.set("search", params.search);
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);
    if (params.min_amount != null)
      query.set("min_amount", String(params.min_amount));
    if (params.max_amount != null)
      query.set("max_amount", String(params.max_amount));
    if (params.country_code) query.set("country_code", params.country_code);
    if (params.is_mobile != null)
      query.set("is_mobile", String(params.is_mobile));
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 24));

    return get<PaginatedData<BraiderSearchItem>>(
      `/braiders?${query.toString()}`,
      lang
    );
  },

  getById: (braiderId: string, lang?: Locale) =>
    get<BraiderDetailResponse>(`/braiders/${braiderId}`, lang),

  getAvailabilitySlots: (
    braiderId: string,
    params: { style_id: string; date_from: string; date_to: string }
  ) => {
    const query = new URLSearchParams({
      style_id: params.style_id,
      date_from: params.date_from,
      date_to: params.date_to,
    });
    return get<AvailableSlotResponse[]>(
      `/braiders/${braiderId}/availability/slots?${query.toString()}`
    );
  },

  getReviews: (
    braiderId: string,
    params: { page?: number; page_size?: number } = {},
    lang?: Locale
  ) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 20));
    return get<PaginatedData<import("@/lib/api/types").PublicReview>>(
      `/braiders/${braiderId}/reviews?${query.toString()}`,
      lang
    );
  },

  getMyReview: (braiderId: string, accessToken: string) => {
    if (!API_BASE) return Promise.reject(new Error("API_BASE not set"));
    return fetch(`${API_BASE}/braiders/${braiderId}/reviews/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        const error = json.error ?? { code: "UNKNOWN_ERROR", message: "Error" };
        throw new ApiError(error.code, error.message, res.status, error.details);
      }
      return json.data as import("@/lib/api/types").Review;
    });
  },

  putMyReview: (
    braiderId: string,
    data: import("@/lib/api/types").ReviewRequest,
    accessToken: string,
    lang?: Locale
  ) => {
    if (!API_BASE) return Promise.reject(new Error("API_BASE not set"));
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    if (lang) headers["Accept-Language"] = lang;

    return fetch(`${API_BASE}/braiders/${braiderId}/reviews/me`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok || json.status === "error") {
        const error = json.error ?? { code: "UNKNOWN_ERROR", message: "Error" };
        throw new ApiError(error.code, error.message, res.status, error.details);
      }
      return json.data as import("@/lib/api/types").Review;
    });
  },
};
