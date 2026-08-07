// Authenticated braider-onboarding endpoints — unlike auth-client.ts these
// all require the session's accessToken, passed in explicitly by the caller
// (this module has no access to next-auth's session on its own).
import type {
  ApiEnvelope,
  BraiderStyleCreateRequest,
  BraiderStyleResponse,
  BraiderStyleUpdateRequest,
  BusinessInfoResponse,
  BusinessInfoUpdateRequest,
  LogoConfirmRequest,
  LogoUploadUrlRequest,
  LogoUploadUrlResponse,
  OnboardingStatusResponse,
  PaginatedData,
  PhoneVerificationStatusResponse,
  SendCodeRequest,
  SendCodeResponse,
  StartVerificationResponse,
  VeriffStatusResponse,
  VerifyCodeRequest,
  VerifyCodeResponse,
  PortfolioImageResponse,
  PortfolioResponse,
  PortfolioImageUploadUrlRequest,
  PortfolioImageUploadUrlResponse,
  PortfolioImageConfirmRequest,
  PortfolioImageUpdateRequest,
  ServiceLocationUpdateRequest,
  ServiceLocationResponse,
  AvailabilitySettingsResponse,
  AvailabilitySettingsUpdateRequest,
  WeeklyWindowResponse,
  WeeklyWindowCreateRequest,
  WeeklyWindowUpdateRequest,
  AvailabilityExceptionResponse,
  AvailabilityExceptionCreateRequest,
  AvailableSlotResponse,
  AccountLinkResponse,
  DashboardLinkResponse,
  PaymentSetupStatusResponse,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { ApiError } from "@/lib/api/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const ONBOARDING_PATH = "/braiders/onboarding";

interface RequestOptions {
  method?: "GET" | "PUT" | "POST" | "DELETE" | "PATCH";
  body?: unknown;
  accessToken: string;
  // Only relevant for the business-info PUT — bio is saved to the caller's
  // locale server-side, defaulting to "en" if omitted.
  lang?: Locale;
}

async function request<TRes>(
  path: string,
  { method = "GET", body, accessToken, lang }: RequestOptions
): Promise<TRes> {
  if (!API_BASE) {
    throw new ApiError(
      "API_BASE_NOT_CONFIGURED",
      "NEXT_PUBLIC_API_BASE_URL is not set.",
      500
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (lang) headers["Accept-Language"] = lang;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${ONBOARDING_PATH}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
  }

  if (res.status === 204) {
    return null as unknown as TRes;
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

export const onboardingApi = {
  getBusinessInfo: (accessToken: string) =>
    request<BusinessInfoResponse>("/business-info", { accessToken }),

  updateBusinessInfo: (
    accessToken: string,
    body: BusinessInfoUpdateRequest,
    lang: Locale
  ) =>
    request<BusinessInfoResponse>("/business-info", {
      method: "PUT",
      body,
      accessToken,
      lang,
    }),

  getLogoUploadUrl: (accessToken: string, body: LogoUploadUrlRequest) =>
    request<LogoUploadUrlResponse>("/business-info/logo/upload-url", {
      method: "POST",
      body,
      accessToken,
    }),

  confirmLogo: (accessToken: string, body: LogoConfirmRequest) =>
    request<BusinessInfoResponse>("/business-info/logo/confirm", {
      method: "POST",
      body,
      accessToken,
    }),

  // Raw presigned-URL PUT — S3, not our API, so no envelope and no auth header.
  uploadLogoFile: async (uploadUrl: string, file: File) => {
    let res: Response;
    try {
      res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
    } catch {
      throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
    }

    if (!res.ok) {
      throw new ApiError(
        "LOGO_UPLOAD_FAILED",
        "Could not upload the image.",
        res.status
      );
    }
  },

  sendPhoneCode: (accessToken: string, body: SendCodeRequest) =>
    request<SendCodeResponse>("/phone-verification/send-code", {
      method: "POST",
      body,
      accessToken,
    }),

  verifyPhoneCode: (accessToken: string, body: VerifyCodeRequest) =>
    request<VerifyCodeResponse>("/phone-verification/verify-code", {
      method: "POST",
      body,
      accessToken,
    }),

  getPhoneVerificationStatus: (accessToken: string) =>
    request<PhoneVerificationStatusResponse>("/phone-verification/status", {
      accessToken,
    }),

  getStatus: (accessToken: string) =>
    request<OnboardingStatusResponse>("/status", { accessToken }),

  startVeriffSession: (accessToken: string) =>
    request<StartVerificationResponse>("/veriff/session", {
      method: "POST",
      accessToken,
    }),

  getVeriffStatus: (accessToken: string) =>
    request<VeriffStatusResponse>("/veriff/status", { accessToken }),

  refreshVeriffStatus: (accessToken: string) =>
    request<VeriffStatusResponse>("/veriff/refresh", {
      method: "POST",
      accessToken,
    }),

  getServices: (accessToken: string, page = 1, pageSize = 20) =>
    request<PaginatedData<BraiderStyleResponse>>(
      `/services?page=${page}&page_size=${pageSize}`,
      { accessToken }
    ),

  addService: (accessToken: string, body: BraiderStyleCreateRequest) =>
    request<BraiderStyleResponse>("/services", {
      method: "POST",
      body,
      accessToken,
    }),

  updateService: (
    accessToken: string,
    braiderStyleId: string,
    body: BraiderStyleUpdateRequest
  ) =>
    request<BraiderStyleResponse>(`/services/${braiderStyleId}`, {
      method: "PUT",
      body,
      accessToken,
    }),

  getPortfolio: (accessToken: string) =>
    request<PortfolioResponse>("/portfolio", { accessToken }),

  getPortfolioUploadUrl: (accessToken: string, body: PortfolioImageUploadUrlRequest) =>
    request<PortfolioImageUploadUrlResponse>("/portfolio/upload-url", {
      method: "POST",
      body,
      accessToken,
    }),

  confirmPortfolioImage: (accessToken: string, body: PortfolioImageConfirmRequest, lang?: Locale) =>
    request<PortfolioImageResponse>("/portfolio/confirm", {
      method: "POST",
      body,
      accessToken,
      lang,
    }),

  updatePortfolioImage: (accessToken: string, imageId: string, body: PortfolioImageUpdateRequest, lang?: Locale) =>
    request<PortfolioImageResponse>(`/portfolio/${imageId}`, {
      method: "PUT",
      body,
      accessToken,
      lang,
    }),

  deletePortfolioImage: (accessToken: string, imageId: string) =>
    request<void>(`/portfolio/${imageId}`, {
      method: "DELETE",
      accessToken,
    }),

  uploadPortfolioFile: async (uploadUrl: string, file: File) => {
    let res: Response;
    try {
      res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
    } catch {
      throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
    }

    if (!res.ok) {
      throw new ApiError(
        "PORTFOLIO_UPLOAD_FAILED",
        "Could not upload the image.",
        res.status
      );
    }
  },

  getServiceLocation: (accessToken: string) =>
    request<ServiceLocationResponse>("/service-location", { accessToken }),

  updateServiceLocation: (accessToken: string, body: ServiceLocationUpdateRequest) =>
    request<ServiceLocationResponse>("/service-location", {
      method: "PUT",
      body,
      accessToken,
    }),
  // -------------------------------------------------------------------------
  // Availability
  // -------------------------------------------------------------------------

  getAvailabilitySettings: (accessToken: string) =>
    request<AvailabilitySettingsResponse>("/availability/settings", {
      accessToken,
    }),

  updateAvailabilitySettings: (
    accessToken: string,
    body: AvailabilitySettingsUpdateRequest
  ) =>
    request<AvailabilitySettingsResponse>("/availability/settings", {
      method: "PUT",
      body,
      accessToken,
    }),

  getWeeklyWindows: (accessToken: string) =>
    request<WeeklyWindowResponse[]>("/availability/weekly-windows", {
      accessToken,
    }),

  createWeeklyWindow: (
    accessToken: string,
    body: WeeklyWindowCreateRequest
  ) =>
    request<WeeklyWindowResponse>("/availability/weekly-windows", {
      method: "POST",
      body,
      accessToken,
    }),

  updateWeeklyWindow: (
    accessToken: string,
    windowId: string,
    body: WeeklyWindowUpdateRequest
  ) =>
    request<WeeklyWindowResponse>(`/availability/weekly-windows/${windowId}`, {
      method: "PATCH", // API docs say PATCH
      body,
      accessToken,
    }),

  deleteWeeklyWindow: (accessToken: string, windowId: string) =>
    request<void>(`/availability/weekly-windows/${windowId}`, {
      method: "DELETE",
      accessToken,
    }),

  getExceptions: (
    accessToken: string,
    dateFrom?: string,
    dateTo?: string
  ) => {
    const query = new URLSearchParams();
    if (dateFrom) query.set("date_from", dateFrom);
    if (dateTo) query.set("date_to", dateTo);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<AvailabilityExceptionResponse[]>(
      `/availability/exceptions${qs}`,
      { accessToken }
    );
  },

  createException: (
    accessToken: string,
    body: AvailabilityExceptionCreateRequest
  ) =>
    request<AvailabilityExceptionResponse>("/availability/exceptions", {
      method: "POST",
      body,
      accessToken,
    }),

  deleteException: (accessToken: string, exceptionId: string) =>
    request<void>(`/availability/exceptions/${exceptionId}`, {
      method: "DELETE",
      accessToken,
    }),

  // -------------------------------------------------------------------------
  // Payment Setup
  // -------------------------------------------------------------------------

  getPaymentSetupStatus: (accessToken: string) =>
    request<PaymentSetupStatusResponse>("/payment-setup/status", {
      accessToken,
    }),

  createAccountLink: (accessToken: string) =>
    request<AccountLinkResponse>("/payment-setup/account-link", {
      method: "POST",
      accessToken,
    }),

  createDashboardLink: (accessToken: string) =>
    request<DashboardLinkResponse>("/payment-setup/dashboard-link", {
      method: "POST",
      accessToken,
    }),

  refreshPaymentSetupStatus: (accessToken: string) =>
    request<PaymentSetupStatusResponse>("/payment-setup/refresh", {
      method: "POST",
      accessToken,
    }),
};
