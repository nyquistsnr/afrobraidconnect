// Booking price quote engine — no auth required. Rate-limited to 30
// requests/hour per IP across the whole router (see RATE_LIMITED below).
import type {
  ApiEnvelope,
  BookingCalculationInput,
  BookingCalculationPreviewResponse,
  BookingCalculationResponse,
  BookingCalculationUpdateRequest,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const BASE_PATH = "/booking-calculations";

async function request<TRes>(
  path: string,
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
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
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
  preview: (input: BookingCalculationInput) =>
    request<BookingCalculationPreviewResponse>(`${BASE_PATH}/preview`, {
      method: "POST",
      body: input,
    }),

  // Persists a DRAFT quote (2h expiry) — call once the customer is ready to
  // move to the booking/payment step.
  create: (input: BookingCalculationInput) =>
    request<BookingCalculationResponse>(BASE_PATH, {
      method: "POST",
      body: input,
    }),

  get: (calculationId: string) =>
    request<BookingCalculationResponse>(`${BASE_PATH}/${calculationId}`),

  update: (calculationId: string, input: BookingCalculationUpdateRequest) =>
    request<BookingCalculationResponse>(`${BASE_PATH}/${calculationId}`, {
      method: "PATCH",
      body: input,
    }),
};
