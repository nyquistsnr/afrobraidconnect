// Public style catalog endpoints — no auth required, used to build the
// SERVICE_TYPE step's style/addon pickers. Responses are locale-resolved
// server-side via Accept-Language (default "en").
import type {
  AddOnPublicResponse,
  ApiEnvelope,
  PaginatedData,
  StyleCategoryPublicResponse,
  StylePublicResponse,
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

export const catalogApi = {
  getStyleCategories: (lang?: Locale) =>
    get<StyleCategoryPublicResponse[]>("/style-categories", lang),

  getStyles: (
    params: {
      categoryId?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {},
    lang?: Locale
  ) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.set("category_id", params.categoryId);
    if (params.search) query.set("search", params.search);
    query.set("page", String(params.page ?? 1));
    query.set("page_size", String(params.pageSize ?? 20));
    return get<PaginatedData<StylePublicResponse>>(
      `/styles?${query.toString()}`,
      lang
    );
  },

  getAddons: (lang?: Locale) =>
    get<AddOnPublicResponse[]>("/addons", lang),
};
