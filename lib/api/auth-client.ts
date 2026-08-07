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

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
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
      headers: { "Content-Type": "application/json" },
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
  signup: (body: SignupEmailRequest) =>
    post<SignupEmailRequest, { message: string; email: string }>(
      "/signup/email",
      body
    ),

  verifyEmail: (body: VerifyEmailRequest) =>
    post<VerifyEmailRequest, AuthTokenResponse>("/verify-email", body),

  resendVerification: (body: ResendVerificationRequest) =>
    post<ResendVerificationRequest, { message: string }>(
      "/resend-verification",
      body
    ),

  login: (body: LoginRequest) =>
    post<LoginRequest, AuthTokenResponse>("/login", body),

  socialLogin: (provider: SocialProvider, body: SocialLoginRequest) =>
    post<SocialLoginRequest, AuthTokenResponse>(`/social/${provider}`, body),

  refresh: (refresh_token: string) =>
    post<RefreshTokenRequest, AuthTokenResponse>("/refresh", {
      refresh_token,
    }),

  logout: (refresh_token: string) =>
    post<LogoutRequest, { message: string }>("/logout", { refresh_token }),

  forgotPassword: (body: ForgotPasswordRequest) =>
    post<ForgotPasswordRequest, { message: string }>(
      "/forgot-password",
      body
    ),

  resetPassword: (body: ResetPasswordRequest) =>
    post<ResetPasswordRequest, { message: string }>("/reset-password", body),
};
