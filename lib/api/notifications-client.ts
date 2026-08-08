import type {
  ApiEnvelope,
  NotificationListParams,
  NotificationResponse,
  PaginatedData,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const NOTIFICATIONS_PATH = "/notifications";

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

export const notificationsApi = {
  // Query params are built with URLSearchParams so date_from/date_to's "+"
  // (UTC offset) is percent-encoded correctly rather than decoding as a space.
  list: (accessToken: string, params: NotificationListParams = {}) => {
    const query = new URLSearchParams();
    if (params.is_read !== undefined) query.set("is_read", String(params.is_read));
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 20));
    return authedRequest<PaginatedData<NotificationResponse>>(
      `${NOTIFICATIONS_PATH}?${query.toString()}`,
      accessToken
    );
  },

  markRead: (accessToken: string, notificationId: string) =>
    authedRequest<NotificationResponse>(
      `${NOTIFICATIONS_PATH}/${notificationId}/read`,
      accessToken,
      { method: "PATCH" }
    ),

  markAllRead: (accessToken: string) =>
    authedRequest<{ marked_count: number }>(
      `${NOTIFICATIONS_PATH}/read-all`,
      accessToken,
      { method: "POST" }
    ),

  remove: (accessToken: string, notificationId: string) =>
    authedRequest<{ message: string }>(
      `${NOTIFICATIONS_PATH}/${notificationId}`,
      accessToken,
      { method: "DELETE" }
    ),
};
