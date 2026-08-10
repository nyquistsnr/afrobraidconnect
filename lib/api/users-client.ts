import type {
  ApiEnvelope,
  UserPublic,
  UserProfileUpdateRequest,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const USERS_PATH = "/users";

interface RequestOptions {
  method?: "GET" | "PUT" | "POST" | "DELETE" | "PATCH";
  body?: string | FormData;
  headers?: Record<string, string>;
}

async function authedFetchJson<T>(
  path: string,
  accessToken: string,
  lang: Locale,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": lang,
      ...options.headers,
    },
    body: options.body,
  });

  const body = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || body.status === "error" || !body.data) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN_ERROR",
      body.error?.message ?? "An unknown error occurred.",
      response.status,
      body.error?.details
    );
  }

  return body.data;
}

export const usersApi = {
  async getMe(accessToken: string, lang: Locale): Promise<UserPublic> {
    return authedFetchJson<UserPublic>(
      `${USERS_PATH}/me`,
      accessToken,
      lang
    );
  },

  async updateMe(
    accessToken: string,
    lang: Locale,
    updates: UserProfileUpdateRequest
  ): Promise<UserPublic> {
    return authedFetchJson<UserPublic>(
      `${USERS_PATH}/me`,
      accessToken,
      lang,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
  },
};
