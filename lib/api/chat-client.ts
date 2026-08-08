// Chat threads/messages — CUSTOMER or BRAIDER role, whichever side the
// booking's participant is on. Same auth flow as the rest of the app.
import type {
  ApiEnvelope,
  ChatMessageResponse,
  ChatMessageSendRequest,
  ChatReportRequest,
  ChatReportResponse,
  ChatThreadResponse,
  PaginatedData,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const CHAT_PATH = "/chat";

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

export const chatApi = {
  listThreads: (
    accessToken: string,
    params: { page?: number; page_size?: number } = {}
  ) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 20));
    return authedRequest<PaginatedData<ChatThreadResponse>>(
      `${CHAT_PATH}/threads?${query.toString()}`,
      accessToken
    );
  },

  // Creates the thread on first call — only succeeds once the booking has
  // had a successful payment. Gate the "Chat" CTA on booking status instead
  // of calling this speculatively.
  getOrCreateThreadForBooking: (accessToken: string, bookingId: string) =>
    authedRequest<ChatThreadResponse>(
      `/chat/bookings/${bookingId}/thread`,
      accessToken
    ),

  listMessages: (
    accessToken: string,
    threadId: string,
    params: { page?: number; page_size?: number } = {}
  ) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.page_size ?? 20));
    return authedRequest<PaginatedData<ChatMessageResponse>>(
      `${CHAT_PATH}/threads/${threadId}/messages?${query.toString()}`,
      accessToken
    );
  },

  sendMessage: (accessToken: string, threadId: string, body: string) =>
    authedRequest<ChatMessageResponse>(
      `${CHAT_PATH}/threads/${threadId}/messages`,
      accessToken,
      { method: "POST", body: { body } satisfies ChatMessageSendRequest }
    ),

  markRead: (accessToken: string, threadId: string) =>
    authedRequest<ChatThreadResponse>(
      `${CHAT_PATH}/threads/${threadId}/read`,
      accessToken,
      { method: "POST" }
    ),

  report: (accessToken: string, threadId: string, body: ChatReportRequest) =>
    authedRequest<ChatReportResponse>(
      `${CHAT_PATH}/threads/${threadId}/report`,
      accessToken,
      { method: "POST", body }
    ),
};
