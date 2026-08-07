import type { OnboardingStatusResponse, OnboardingStep } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";

export type ActiveStep = Exclude<OnboardingStep, "COMPLETED">;

// Fixed order the backend evaluates *_completed_at fields in to compute
// current_step — mirrors the onboarding API doc's _STEP_ORDER.
export const ONBOARDING_STEP_ORDER: readonly ActiveStep[] = [
  "BUSINESS_INFO",
  "PHONE_VERIFICATION",
  "VERIFF",
  "SERVICE_TYPE",
  "PORTFOLIO",
  "SERVICE_LOCATION",
  "AVAILABILITY",
  "PAYMENT_SETUP",
];

const STEP_SLUGS: Record<ActiveStep, string> = {
  BUSINESS_INFO: "business-info",
  PHONE_VERIFICATION: "phone-verification",
  VERIFF: "id-verification",
  SERVICE_TYPE: "service-type",
  PORTFOLIO: "portfolio",
  SERVICE_LOCATION: "location",
  AVAILABILITY: "availability",
  PAYMENT_SETUP: "payment",
};

// Only these steps have real step pages today — everything else falls
// through to the [step] placeholder route.
export const BUILT_ONBOARDING_STEPS: readonly ActiveStep[] = [
  "BUSINESS_INFO",
  "PHONE_VERIFICATION",
  "VERIFF",
  "SERVICE_TYPE",
  "PORTFOLIO",
  "SERVICE_LOCATION",
  "AVAILABILITY",
  "PAYMENT_SETUP",
];

export function onboardingStepPath(lang: Locale, step: OnboardingStep): string {
  if (step === "COMPLETED") return `/${lang}/dashboard`;
  return `/${lang}/onboarding/${STEP_SLUGS[step]}`;
}

export function stepSlugToStep(slug: string): ActiveStep | undefined {
  return (Object.keys(STEP_SLUGS) as ActiveStep[]).find(
    (step) => STEP_SLUGS[step] === slug
  );
}

export function previousStep(step: ActiveStep): ActiveStep | undefined {
  const index = ONBOARDING_STEP_ORDER.indexOf(step);
  return index > 0 ? ONBOARDING_STEP_ORDER[index - 1] : undefined;
}

const STEP_COMPLETED_KEYS: Record<ActiveStep, keyof OnboardingStatusResponse> = {
  BUSINESS_INFO: "business_info_completed_at",
  PHONE_VERIFICATION: "phone_verification_completed_at",
  VERIFF: "veriff_completed_at",
  SERVICE_TYPE: "service_type_completed_at",
  PORTFOLIO: "portfolio_completed_at",
  SERVICE_LOCATION: "service_location_completed_at",
  AVAILABILITY: "availability_completed_at",
  PAYMENT_SETUP: "payment_setup_completed_at",
};

export function isStepCompleted(
  status: OnboardingStatusResponse,
  step: ActiveStep
): boolean {
  return status[STEP_COMPLETED_KEYS[step]] !== null;
}

export const STEP_DICT_KEYS: Record<ActiveStep, string> = {
  BUSINESS_INFO: "businessInfo",
  PHONE_VERIFICATION: "phoneVerification",
  VERIFF: "veriff",
  SERVICE_TYPE: "serviceType",
  PORTFOLIO: "portfolio",
  SERVICE_LOCATION: "serviceLocation",
  AVAILABILITY: "availability",
  PAYMENT_SETUP: "paymentSetup",
};
