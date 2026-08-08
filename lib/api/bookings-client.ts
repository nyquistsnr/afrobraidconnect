// Customer-side booking creation/lookup — CUSTOMER role required.
import type {
  ApiEnvelope,
  BookingListParams,
  BookingResponse,
  BookingSummary,
  CreateBookingRequest,
  PaginatedData,
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

// The raw wire shape is flat (page/page_size/total_items alongside items),
// unlike the braider-search endpoint's nested `pagination` object — reshaped
// below into the same PaginatedData<T> shape the rest of the app expects.
interface RawBookingListResponse {
  items: BookingSummary[];
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
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

  list: async (
    accessToken: string,
    params: BookingListParams = {}
  ): Promise<PaginatedData<BookingSummary>> => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);
    if (params.search) query.set("search", params.search);
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 20));

    const raw = await authedRequest<RawBookingListResponse>(
      `${BOOKINGS_PATH}?${query.toString()}`,
      accessToken
    );

    return {
      items: raw.items,
      pagination: {
        page: raw.page,
        page_size: raw.page_size,
        total_items: raw.total_items,
        total_pages: raw.total_pages,
        has_next: raw.has_next,
        has_previous: raw.has_previous,
      },
    };
  },
};
