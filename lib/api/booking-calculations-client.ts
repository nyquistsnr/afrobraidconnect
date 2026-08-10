// Booking price quote engine — no auth required. Rate-limited to 30
// requests/hour per IP across the whole router (see RATE_LIMITED below).
import type {
  ApiEnvelope,
  BookingCalculationInput,
  BookingCalculationPreviewResponse,
  BookingCalculationResponse,
  BookingCalculationUpdateRequest,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_PATH = "/booking-calculations";

async function request<TRes>(
  path: string,
  lang: Locale,
  options: { method?: string; body?: unknown } = {}
): Promise<TRes> {
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
      method: options.method ?? "GET",
      headers: {
        "Accept-Language": lang,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
  }

  if (res.status === 204) {
    return undefined as TRes;
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

export const bookingCalculationsApi = {
  // Stateless — writes nothing. Used for the live quote as the customer
  // configures their selection.
  preview: (input: BookingCalculationInput, lang: Locale) =>
    request<BookingCalculationPreviewResponse>(`${BASE_PATH}/preview`, lang, {
      method: "POST",
      body: input,
    }),

  // Persists a DRAFT quote (2h expiry) — call once the customer is ready to
  // move to the booking/payment step.
  create: (input: BookingCalculationInput, lang: Locale) =>
    request<BookingCalculationResponse>(BASE_PATH, lang, {
      method: "POST",
      body: input,
    }),

  get: (calculationId: string, lang: Locale) =>
    request<BookingCalculationResponse>(`${BASE_PATH}/${calculationId}`, lang),

  update: (calculationId: string, input: BookingCalculationUpdateRequest, lang: Locale) =>
    request<BookingCalculationResponse>(`${BASE_PATH}/${calculationId}`, lang, {
      method: "PATCH",
      body: input,
    }),
};
