// Isomorphic: called from both the server (NextAuth's authorize callback)
// and the client (signup/verify/forgot-password/reset-password mutations).
import type {
  ApiEnvelope,
  AuthTokenResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SignupEmailRequest,
  SocialLoginRequest,
  SocialProvider,
  VerifyEmailRequest,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";

// NEXT_PUBLIC_API_BASE_URL is expected to already include the /api/v1
// prefix (e.g. http://localhost:8000/api/v1) — this only appends /auth.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_PATH = "/auth";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// lang is optional here (unlike the other clients' request helpers) because
// two callers below — refresh() and logout() — run as background/best-effort
// calls with no user-facing text in their response, so there's nothing to
// localize; every other method must pass it.
async function post<TReq, TRes>(
  path: string,
  body: TReq,
  lang?: Locale
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
    res = await fetch(`${API_BASE}${AUTH_PATH}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(lang ? { "Accept-Language": lang } : {}),
      },
      body: JSON.stringify(body),
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

export const authApi = {
  signup: (body: SignupEmailRequest, lang: Locale) =>
    post<SignupEmailRequest, { message: string; email: string }>(
      "/signup/email",
      body,
      lang
    ),

  verifyEmail: (body: VerifyEmailRequest, lang: Locale) =>
    post<VerifyEmailRequest, AuthTokenResponse>("/verify-email", body, lang),

  resendVerification: (body: ResendVerificationRequest, lang: Locale) =>
    post<ResendVerificationRequest, { message: string }>(
      "/resend-verification",
      body,
      lang
    ),

  // The Accept-Language sent here is also what determines the locale baked
  // into that login's NEW_LOGIN notification (fixed at creation time).
  login: (body: LoginRequest, lang: Locale) =>
    post<LoginRequest, AuthTokenResponse>("/login", body, lang),

  socialLogin: (provider: SocialProvider, body: SocialLoginRequest, lang: Locale) =>
    post<SocialLoginRequest, AuthTokenResponse>(`/social/${provider}`, body, lang),

  // Background token refresh — no user-facing text in the response, so
  // there's nothing here that needs localizing.
  refresh: (refresh_token: string) =>
    post<RefreshTokenRequest, AuthTokenResponse>("/refresh", {
      refresh_token,
    }),

  // Best-effort revoke on sign-out; the response message is never surfaced
  // to the user (see app/api/auth/logout/route.ts), so no lang needed.
  logout: (refresh_token: string) =>
    post<LogoutRequest, { message: string }>("/logout", { refresh_token }),

  forgotPassword: (body: ForgotPasswordRequest, lang: Locale) =>
    post<ForgotPasswordRequest, { message: string }>(
      "/forgot-password",
      body,
      lang
    ),

  // Also determines the locale baked into that reset's PASSWORD_CHANGED
  // notification.
  resetPassword: (body: ResetPasswordRequest, lang: Locale) =>
    post<ResetPasswordRequest, { message: string }>(
      "/reset-password",
      body,
      lang
    ),
};
