import type { Dictionary } from "@/app/[lang]/dictionaries";

type ErrorsDict = Dictionary["common"]["errors"];

const CODE_TO_KEY: Record<string, keyof ErrorsDict> = {
  VALIDATION_ERROR: "validationError",
  EMAIL_ALREADY_EXISTS: "emailAlreadyExists",
  PHONE_ALREADY_EXISTS: "phoneAlreadyExists",
  INVALID_CREDENTIALS: "invalidCredentials",
  EMAIL_NOT_VERIFIED: "emailNotVerified",
  USER_NOT_ACTIVE: "userNotActive",
  INVALID_OTP: "invalidOtp",
  OTP_EXPIRED: "otpExpired",
  TOO_MANY_OTP_ATTEMPTS: "tooManyOtpAttempts",
  SOCIAL_AUTH_FAILED: "socialAuthFailed",
  UNSUPPORTED_PROVIDER: "unsupportedProvider",
  USER_TYPE_REQUIRED: "userTypeRequired",
  RATE_LIMITED: "rateLimited",
  NETWORK_ERROR: "networkError",
  FORBIDDEN: "forbidden",
  INVALID_ACCESS_TOKEN: "invalidAccessToken",
  INVALID_LOGO_UPLOAD: "invalidLogoUpload",
  LOGO_NOT_FOUND: "logoNotFound",
  LOGO_UPLOAD_FAILED: "invalidLogoUpload",
  PHONE_VERIFICATION_API_UNAVAILABLE: "phoneVerificationUnavailable",
  INVALID_VERIFICATION_CODE: "invalidVerificationCode",
  VERIFF_API_UNAVAILABLE: "veriffUnavailable",
  VERIFF_SESSION_NOT_FOUND: "veriffSessionNotFound",
  STYLE_NOT_FOUND: "styleNotFound",
  STYLE_NOT_ACTIVE: "styleNotActive",
  BRAIDER_STYLE_NOT_FOUND: "styleNotFound",
  BRAIDER_STYLE_ALREADY_EXISTS: "styleAlreadyAdded",
  INVALID_STYLE_VARIATION: "invalidStyleVariation",
  INVALID_ADDON: "invalidAddon",
};

// `code` here is whatever error.code the backend returned (see ApiError),
// or a NextAuth SignInResponse.code for the login path — both share the
// same vocabulary since the credentials provider forwards our ApiError.code.
export function getAuthErrorMessage(
  code: string | undefined | null,
  dict: ErrorsDict
): string {
  if (!code) return dict.generic;
  return CODE_TO_KEY[code] ? dict[CODE_TO_KEY[code]] : dict.generic;
}
