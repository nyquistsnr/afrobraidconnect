import type {
  ApiEnvelope,
  UserPublic,
  UserProfileUpdateRequest,
} from "@/lib/api/types";
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
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
  async getMe(accessToken: string): Promise<UserPublic> {
    return authedFetchJson<UserPublic>(
      `${USERS_PATH}/me`,
      accessToken
    );
  },

  async updateMe(
    accessToken: string,
    updates: UserProfileUpdateRequest
  ): Promise<UserPublic> {
    return authedFetchJson<UserPublic>(
      `${USERS_PATH}/me`,
      accessToken,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
  },
};
