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
  BRAIDER_NOT_FOUND: "braiderNotFound",
  BRAIDER_STYLE_DURATION_MISSING: "braiderStyleDurationMissing",
  BRAIDER_COUNTRY_MISSING: "braiderCountryMissing",
  MOBILE_SERVICE_NOT_OFFERED: "mobileServiceNotOffered",
  CLIENT_LOCATION_MISSING: "clientLocationMissing",
  MOBILE_LOCATION_OUT_OF_RANGE: "mobileLocationOutOfRange",
  BOOKING_CALCULATION_NOT_FOUND: "bookingCalculationNotFound",
  BOOKING_CALCULATION_ALREADY_USED: "bookingCalculationAlreadyUsed",
  BOOKING_CALCULATION_EXPIRED: "bookingCalculationExpired",
  BOOKING_STARTS_IN_PAST: "bookingStartsInPast",
  BRAIDER_NOT_PAYABLE: "braiderNotPayable",
  BOOKING_PRICE_DRIFT: "bookingPriceDrift",
  BOOKING_SLOT_UNAVAILABLE: "bookingSlotUnavailable",
  BOOKING_NOT_FOUND: "bookingNotFound",
  BOOKING_PAYMENT_NOT_FOUND: "bookingPaymentNotFound",
  BOOKING_PAYMENT_NOT_CAPTURABLE: "bookingPaymentNotCapturable",
  PAYPAL_PAYMENT_DECLINED: "paypalPaymentDeclined",
  PAYPAL_API_UNAVAILABLE: "paypalApiUnavailable",
  INVALID_BOOKING_DATE_RANGE: "invalidBookingDateRange",
  INVALID_CHAT_LOCALE: "invalidChatLocale",
  CHAT_NOT_AVAILABLE: "chatNotAvailable",
  CHAT_THREAD_NOT_FOUND: "chatThreadNotFound",
  CHAT_ACCESS_DENIED: "chatAccessDenied",
  CHAT_MESSAGE_NOT_FOUND: "chatMessageNotFound",
  CHAT_REPORT_NOT_FOUND: "chatReportNotFound",
  NOTIFICATION_NOT_FOUND: "notificationNotFound",
  INVALID_DATE_RANGE: "invalidDateRange",
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
