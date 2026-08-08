export type UserType = "CUSTOMER" | "BRAIDER" | "ADMIN";

export type OnboardingStep =
  | "BUSINESS_INFO"
  | "PHONE_VERIFICATION"
  | "VERIFF"
  | "SERVICE_TYPE"
  | "PORTFOLIO"
  | "SERVICE_LOCATION"
  | "AVAILABILITY"
  | "PAYMENT_SETUP"
  | "COMPLETED";

export interface BraiderOnboardingSummary {
  current_step: OnboardingStep;
  completed_at: string | null;
}

export interface BraiderAuthProfile {
  business_name: string | null;
  logo_url: string | null;
  onboarding: BraiderOnboardingSummary;
}

export interface UserPublic {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone_number: string | null;
  user_type: UserType;
}

export interface UserProfileUpdateRequest {
  first_name?: string;
  last_name?: string | null;
  phone_number?: string | null;
}

// Returned by verify-email, login, social/{provider}, refresh.
export interface AuthTokenResponse extends UserPublic {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
  // Only populated by /login and /social/{provider}; null on /verify-email and /refresh.
  braider: BraiderAuthProfile | null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown[];
}

export interface ApiEnvelope<T> {
  status: "success" | "error";
  status_label: string;
  data: T | null;
  error: ApiErrorBody | null;
}

export interface SignupEmailRequest {
  first_name: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  password: string;
  user_type: "CUSTOMER" | "BRAIDER";
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export type SocialProvider = "google" | "facebook" | "tiktok";

export interface SocialLoginRequest {
  provider_token: string;
  user_type?: "CUSTOMER" | "BRAIDER";
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

// ---------------------------------------------------------------------------
// Braider onboarding
// ---------------------------------------------------------------------------

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export type BioSource = "HUMAN" | "MACHINE" | "PENDING" | "FAILED";

export interface BusinessInfoResponse {
  business_name: string | null;
  logo_url: string | null;
  bio_en: string | null;
  bio_de: string | null;
  bio_fr: string | null;
  bio_en_source: BioSource | null;
  bio_de_source: BioSource | null;
  bio_fr_source: BioSource | null;
  gender: Gender | null;
  is_complete: boolean;
}

export interface BusinessInfoUpdateRequest {
  business_name?: string;
  bio?: string;
  gender?: Gender;
}

export type LogoContentType = "image/jpeg" | "image/png" | "image/webp";

export interface LogoUploadUrlRequest {
  content_type: LogoContentType;
}

export interface LogoUploadUrlResponse {
  upload_url: string;
  object_key: string;
  expires_in: number;
}

export interface LogoConfirmRequest {
  object_key: string;
}

export interface SendCodeRequest {
  phone_number: string;
}

export interface SendCodeResponse {
  status: string;
  phone_number: string;
}

export interface VerifyCodeRequest {
  phone_number: string;
  code: string;
}

export interface VerifyCodeResponse {
  status: string;
  is_complete: boolean;
}

export interface PhoneVerificationStatusResponse {
  phone_number: string | null;
  is_verified: boolean;
}

export interface OnboardingStatusResponse {
  current_step: OnboardingStep;
  business_info_completed_at: string | null;
  phone_verification_completed_at: string | null;
  veriff_completed_at: string | null;
  service_type_completed_at: string | null;
  portfolio_completed_at: string | null;
  service_location_completed_at: string | null;
  availability_completed_at: string | null;
  payment_setup_completed_at: string | null;
  completed_at: string | null;
}

export type VeriffSessionStatus =
  | "CREATED"
  | "SUBMITTED"
  | "APPROVED"
  | "DECLINED"
  | "RESUBMISSION_REQUESTED"
  | "REVIEW"
  | "EXPIRED"
  | "ABANDONED";

export interface StartVerificationResponse {
  session_id: string;
  verification_url: string;
  status: VeriffSessionStatus;
  status_label: string;
}

export interface VeriffStatusResponse {
  has_session: boolean;
  session_id: string | null;
  verification_url: string | null;
  status: VeriffSessionStatus | null;
  status_label: string;
  reason: string | null;
  reason_code: number | null;
  acceptance_time: string | null;
  submission_time: string | null;
  decision_time: string | null;
  is_complete: boolean;
}

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export type PortfolioImageContentType = "image/jpeg" | "image/png" | "image/webp";

export interface PortfolioImageResponse {
  id: string;
  url: string;
  caption_en: string | null;
  caption_de: string | null;
  caption_fr: string | null;
  caption_en_source: BioSource | null;
  caption_de_source: BioSource | null;
  caption_fr_source: BioSource | null;
  position: number;
}

export interface PortfolioResponse {
  images: PortfolioImageResponse[];
  min_required: number;
  is_complete: boolean;
}

export interface PortfolioImageUploadUrlRequest {
  content_type: PortfolioImageContentType;
}

export interface PortfolioImageUploadUrlResponse {
  upload_url: string;
  object_key: string;
  expires_in: number;
}

export interface PortfolioImageConfirmRequest {
  object_key: string;
  caption?: string;
}

export interface PortfolioImageUpdateRequest {
  caption?: string | null;
}

// ---------------------------------------------------------------------------
// Service Location
// ---------------------------------------------------------------------------

export type LocationType = "HOME_STUDIO" | "SALON";

export interface ServiceLocationUpdateRequest {
  location_type?: LocationType | null;
  salon_name?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  offers_mobile?: boolean;
  travel_radius_km?: number | null;
  travel_fee?: number | null;
}

export interface ServiceLocationResponse {
  location_type: LocationType | null;
  salon_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  offers_mobile: boolean;
  travel_radius_km: number | null;
  travel_fee: number | null;
  is_complete: boolean;
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type AvailabilityExceptionType = "CLOSED" | "CUSTOM_HOURS";

export interface AvailabilitySettingsResponse {
  timezone: string;
  min_notice_hours: number;
  max_advance_days: number;
  buffer_minutes: number;
}

export interface AvailabilitySettingsUpdateRequest {
  timezone?: string;
  min_notice_hours?: number;
  max_advance_days?: number;
  buffer_minutes?: number;
}

export interface WeeklyWindowResponse {
  id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface WeeklyWindowCreateRequest {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface WeeklyWindowUpdateRequest {
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

export interface AvailabilityExceptionResponse {
  id: string;
  date: string;
  exception_type: AvailabilityExceptionType;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface AvailabilityExceptionCreateRequest {
  date: string;
  exception_type: AvailabilityExceptionType;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface AvailableSlotResponse {
  start_at: string;
  end_at: string;
}

// ---------------------------------------------------------------------------
// Payment Setup (Stripe Connect)
// ---------------------------------------------------------------------------

export interface AccountLinkResponse {
  onboarding_url: string;
}

export interface DashboardLinkResponse {
  dashboard_url: string;
}

export interface PaymentSetupStatusResponse {
  has_account: boolean;
  stripe_account_id: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  disabled_reason: string | null;
  requirements_currently_due: string[];
  is_complete: boolean;
}

// ---------------------------------------------------------------------------
// Style catalog (public, locale-resolved via Accept-Language) + braider menu
// ---------------------------------------------------------------------------

export interface StyleCategoryPublicResponse {
  id: string;
  slug: string;
  name: string;
  display_order: number;
}

export interface StyleImageResponse {
  id: string;
  url: string;
  position: number;
}

export interface StyleVariationPublicResponse {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export interface StylePublicResponse {
  id: string;
  slug: string;
  category_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  images: StyleImageResponse[];
  variations: StyleVariationPublicResponse[];
}

export interface AddOnPublicResponse {
  id: string;
  slug: string;
  name: string;
  suggested_price: number | null;
  is_active: boolean;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface BraiderStyleVariationInput {
  style_variation_id: string;
  price: number;
}

export interface BraiderStyleAddonInput {
  addon_id: string;
  price: number;
  is_required?: boolean;
}

export interface BraiderStyleCreateRequest {
  style_id: string;
  base_price: number;
  duration_minutes?: number;
  variations?: BraiderStyleVariationInput[];
  addons?: BraiderStyleAddonInput[];
}

export interface BraiderStyleUpdateRequest {
  base_price?: number;
  duration_minutes?: number;
  is_active?: boolean;
  variations?: BraiderStyleVariationInput[];
  addons?: BraiderStyleAddonInput[];
}

export interface BraiderStyleVariationResponse {
  id: string;
  style_variation_id: string;
  price: number;
}

export interface BraiderStyleAddonResponse {
  id: string;
  addon_id: string;
  price: number;
  is_required: boolean;
}

export interface BraiderStyleResponse {
  id: string;
  style_id: string;
  style_slug: string;
  style_name_en: string;
  style_name_de: string | null;
  style_name_fr: string | null;
  primary_image_url: string | null;
  base_price: number;
  duration_minutes: number | null;
  is_active: boolean;
  variations: BraiderStyleVariationResponse[];
  addons: BraiderStyleAddonResponse[];
}

// ---------------------------------------------------------------------------
// Braider discovery (public search + map results)
// ---------------------------------------------------------------------------

export interface MatchedStyleResponse {
  style_id: string;
  name: string;
  base_price: string;
  duration_minutes: number | null;
}

export interface BraiderLocationResponse {
  location_type: LocationType | null;
  salon_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  offers_mobile: boolean;
  travel_radius_km: number | null;
  travel_fee: string | null;
  // Not part of the documented /braiders search response yet — the API only
  // returns city/country for search results. Read defensively until the
  // backend adds per-braider coordinates for map pins.
  latitude?: number | null;
  longitude?: number | null;
}

export interface BraiderSearchItem {
  id: string;
  business_name: string | null;
  logo_url: string | null;
  location: BraiderLocationResponse | null;
  distance_km: number | null;
  cover_photo_url: string | null;
  matched_style: MatchedStyleResponse | null;
  styles: MatchedStyleResponse[];
}

export interface BraiderSearchParams {
  lat?: number;
  lng?: number;
  radius_km?: number;
  style_id?: string;
  style_slug?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  country_code?: string;
  is_mobile?: boolean;
  page?: number;
  page_size?: number;
}

// ---------------------------------------------------------------------------
// Braider public profile (GET /braiders/{braider_id})
// ---------------------------------------------------------------------------

export interface BraiderPortfolioImage {
  id: string;
  url: string;
  caption: string | null;
  position: number;
}

export interface BraiderOfferedStyleVariation {
  id: string;
  name: string;
  price: string;
}

export interface BraiderOfferedStyleAddon {
  id: string;
  name: string;
  price: string;
  is_required: boolean;
}

export interface BraiderOfferedStyle {
  style_id: string;
  slug: string;
  name: string;
  base_price: string;
  duration_minutes: number | null;
  variations: BraiderOfferedStyleVariation[];
  addons: BraiderOfferedStyleAddon[];
}

export interface BraiderDetailResponse {
  id: string;
  business_name: string | null;
  logo_url: string | null;
  bio: string | null;
  gender: Gender | null;
  location: BraiderLocationResponse | null;
  portfolio: BraiderPortfolioImage[];
  styles: BraiderOfferedStyle[];
}

// ---------------------------------------------------------------------------
// Booking calculations (public quote engine) + bookings (auth required)
// ---------------------------------------------------------------------------

export interface BookingCalculationInput {
  braider_id: string;
  style_id: string;
  braider_style_variation_id?: string;
  braider_style_addon_ids?: string[];
  is_mobile?: boolean;
  client_address?: string;
  client_latitude?: string;
  client_longitude?: string;
}

export type BookingCalculationUpdateRequest = Partial<BookingCalculationInput>;

export type BookingLineItemType =
  | "SERVICE"
  | "VARIATION"
  | "ADDON"
  | "TRAVEL"
  | "PLATFORM_FEE"
  | "VAT_SERVICE"
  | "VAT_PLATFORM_FEE";

export interface BookingLineItem {
  item_type: BookingLineItemType;
  name: string | null;
  quantity: number;
  unit_amount: string;
  line_amount: string;
  is_required: boolean;
}

export interface BookingCalculationPreviewResponse {
  currency: "EUR";
  braider_id: string;
  style_id: string;
  style_name: string;
  duration_minutes: number;
  is_mobile: boolean;
  client_address: string | null;
  client_latitude: string | null;
  client_longitude: string | null;
  items: BookingLineItem[];
  service_subtotal: string;
  travel_fee: string;
  subtotal: string;
  platform_fee: string;
  vat_on_service: string;
  vat_on_platform_fee: string;
  vat_rate: string;
  country: string | null;
  vat_total: string;
  total: string;
  deposit_amount: string;
  balance_amount: string;
  deposit_note: string;
}

export type BookingCalculationStatus = "DRAFT" | "CONSUMED" | "EXPIRED";

export interface BookingCalculationResponse
  extends BookingCalculationPreviewResponse {
  id: string;
  status: BookingCalculationStatus;
  expires_at: string;
}

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED_BY_CUSTOMER"
  | "CANCELLED_BY_BRAIDER"
  | "CANCELLED_NO_PAYMENT"
  | "EXPIRED"
  | "DISPUTED";

export type PaymentSchedule = "FULL_UPFRONT" | "DEPOSIT_THEN_BALANCE";
export type PaymentPurpose = "FULL" | "DEPOSIT" | "BALANCE";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED";

export interface BookingPaymentResponse {
  purpose: PaymentPurpose;
  status: PaymentStatus;
  amount: string;
  currency: "EUR";
  client_secret: string | null;
}

export interface CreateBookingRequest {
  booking_calculation_id: string;
  starts_at: string;
  terms_accepted: true;
}

export interface BookingResponse {
  id: string;
  reference: string;
  status: BookingStatus;
  braider_id: string;
  braider_name: string;
  customer_name: string;
  style_id: string;
  style_name: string;
  duration_minutes: number;
  is_mobile: boolean;
  client_address: string | null;
  client_latitude: string | null;
  client_longitude: string | null;
  country: string;
  currency: "EUR";
  starts_at: string;
  ends_at: string;
  items: BookingLineItem[];
  service_subtotal: string;
  travel_fee: string;
  subtotal: string;
  platform_fee: string;
  vat_on_service: string;
  vat_on_platform_fee: string;
  vat_total: string;
  total: string;
  deposit_amount: string;
  balance_amount: string;
  payment_schedule: PaymentSchedule;
  cancellation_cutoff_at: string;
  payments: BookingPaymentResponse[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Customer bookings list (GET /bookings)
// ---------------------------------------------------------------------------

export interface BookingSummary {
  id: string;
  reference: string;
  status: BookingStatus;
  braider_id: string;
  braider_name: string;
  customer_name: string;
  style_name: string;
  starts_at: string;
  ends_at: string;
  total: string;
  currency: "EUR";
}

export interface BookingListParams {
  status?: BookingStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
