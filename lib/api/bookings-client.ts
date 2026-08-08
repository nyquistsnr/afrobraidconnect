// Customer-side booking creation/lookup — CUSTOMER role required.
import type {
  ApiEnvelope,
  BookingResponse,
  CreateBookingRequest,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const BOOKINGS_PATH = "/bookings";

async function authedRequest<TRes>(
  path: string,
  accessToken: string,
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
        Authorization: `Bearer ${accessToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
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

export const bookingsApi = {
  // Consumes a DRAFT calculation + an appointment time; creates the booking
  // and a Stripe PaymentIntent (client_secret only returned here, once).
  create: (accessToken: string, body: CreateBookingRequest) =>
    authedRequest<BookingResponse>(BOOKINGS_PATH, accessToken, {
      method: "POST",
      body,
    }),

  getById: (accessToken: string, bookingId: string) =>
    authedRequest<BookingResponse>(`${BOOKINGS_PATH}/${bookingId}`, accessToken),
};
