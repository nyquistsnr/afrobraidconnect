import type {
  ApiEnvelope,
  TryOnRequest,
  TryOnResponse,
  TryOnUploadUrlRequest,
  TryOnUploadUrlResponse,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const TRYON_PATH = "/tryon";

async function authedRequest<TRes>(
  path: string,
  accessToken: string,
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
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": lang,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
  }

  // Handle 204 No Content (e.g. for DELETE requests)
  if (res.status === 204) {
    return {} as TRes;
  }

  const json: ApiEnvelope<TRes> = await res.json();

  if (json.status === "error" || json.data === undefined) {
    const error = json.error ?? {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong.",
    };
    throw new ApiError(error.code, error.message, res.status, error.details);
  }

  return json.data as TRes;
}

export const tryonApi = {
  getUploadUrl: (accessToken: string, lang: Locale, body: TryOnUploadUrlRequest) =>
    authedRequest<TryOnUploadUrlResponse>(`${TRYON_PATH}/upload-url`, accessToken, lang, {
      method: "POST",
      body,
    }),

  uploadFile: async (uploadUrl: string, file: File) => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }
  },

  create: (accessToken: string, lang: Locale, body: TryOnRequest) =>
    authedRequest<TryOnResponse>(TRYON_PATH, accessToken, lang, {
      method: "POST",
      body,
    }),

  getById: (accessToken: string, lang: Locale, id: string) =>
    authedRequest<TryOnResponse>(`${TRYON_PATH}/${id}`, accessToken, lang),

  list: (accessToken: string, lang: Locale) =>
    authedRequest<TryOnResponse[]>(TRYON_PATH, accessToken, lang),

  delete: (accessToken: string, lang: Locale, id: string) =>
    authedRequest<void>(`${TRYON_PATH}/${id}`, accessToken, lang, { method: "DELETE" }),
};
