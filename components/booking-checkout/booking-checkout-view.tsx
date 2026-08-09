"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Link from "next/link";
import Image from "next/image";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { BookingResponse, BraiderDetailResponse } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import { formatSlotDateTime } from "@/components/braider-detail/format";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { ApiError } from "@/lib/api/auth-client";
import { bookingCalculationsApi } from "@/lib/api/booking-calculations-client";
import { bookingsApi } from "@/lib/api/bookings-client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PriceSummary } from "@/components/booking-checkout/price-summary";
import { PaymentStep } from "@/components/booking-checkout/payment-step";
import type { BookingCheckoutDict } from "@/components/booking-checkout/types";

type ErrorsDict = Dictionary["common"]["errors"];

// Calculation-level failures where retrying the exact same request can
// never succeed — the customer has to go configure a fresh quote.
const FATAL_CALCULATION_CODES = new Set([
  "BOOKING_CALCULATION_NOT_FOUND",
  "BOOKING_CALCULATION_ALREADY_USED",
  "BOOKING_CALCULATION_EXPIRED",
  "BOOKING_PRICE_DRIFT",
  "BOOKING_SLOT_UNAVAILABLE",
  "BOOKING_STARTS_IN_PAST",
]);

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 90_000;

function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

type Phase = "review" | "payment" | "confirming" | "stillProcessing" | "success";

export function BookingCheckoutView({
  lang,
  braider,
  calculationId,
  startsAt,
  dict,
  errorsDict,
}: {
  lang: Locale;
  braider: BraiderDetailResponse;
  calculationId: string;
  startsAt: string;
  dict: BookingCheckoutDict;
  errorsDict: ErrorsDict;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeBookingId = searchParams.get("booking_id");
  const { data: session, status: sessionStatus } = useSession();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [phase, setPhase] = useState<Phase>(
    resumeBookingId ? "confirming" : "review"
  );
  const [fatalError, setFatalError] = useState(false);

  const profileHref = `/${lang}/braiders/${braider.id}`;

  const calculationQuery = useQuery({
    queryKey: ["booking-calculation", calculationId],
    queryFn: () => bookingCalculationsApi.get(calculationId),
    enabled: !resumeBookingId,
    retry: false,
  });

  const resumeBookingQuery = useQuery({
    queryKey: ["booking", resumeBookingId],
    queryFn: () => bookingsApi.getById(session!.accessToken, resumeBookingId!),
    enabled: !!resumeBookingId && !!session?.accessToken,
    retry: false,
  });

  // `booking` is the source of truth for rendering and gets populated by
  // the mutation/poll below; while resuming after a redirect it hasn't been
  // set yet, so fall back to the just-fetched resume data without a
  // render-triggered effect just to copy one piece of state into another.
  const effectiveBooking = booking ?? resumeBookingQuery.data ?? null;

  const createBookingMutation = useMutation({
    mutationFn: () => {
      if (!session?.accessToken) {
        return Promise.reject(new Error("NOT_AUTHENTICATED"));
      }
      return bookingsApi.create(session.accessToken, {
        booking_calculation_id: calculationId,
        starts_at: startsAt,
        terms_accepted: true,
      });
    },
    onSuccess: (data) => {
      setBooking(data);
      setPhase("payment");
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, errorsDict));
      if (code && FATAL_CALCULATION_CODES.has(code)) {
        setFatalError(true);
      }
    },
  });

  // Waits for the Stripe webhook to flip the booking to CONFIRMED after the
  // customer's confirmPayment() call resolves client-side.
  const pollCancelledRef = useRef(false);
  useEffect(() => {
    if (phase !== "confirming" || !effectiveBooking || !session?.accessToken) {
      return;
    }

    pollCancelledRef.current = false;
    const bookingId = effectiveBooking.id;
    const accessToken = session.accessToken;
    const startedAt = Date.now();

    async function poll() {
      while (
        !pollCancelledRef.current &&
        Date.now() - startedAt < POLL_TIMEOUT_MS
      ) {
        try {
          const latest = await bookingsApi.getById(accessToken, bookingId);
          if (pollCancelledRef.current) return;
          setBooking(latest);
          if (latest.status === "CONFIRMED") {
            setPhase("success");
            return;
          }
        } catch {
          // Transient — keep polling until the timeout.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (!pollCancelledRef.current) setPhase("stillProcessing");
    }

    poll();
    return () => {
      pollCancelledRef.current = true;
    };
  }, [phase, effectiveBooking, session?.accessToken]);

  // --- Fatal / not-found quote or booking --------------------------------
  if (
    (!resumeBookingId &&
      (calculationQuery.isError ||
        (calculationQuery.data && calculationQuery.data.status !== "DRAFT") ||
        fatalError)) ||
    (!!resumeBookingId && resumeBookingQuery.isError)
  ) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <AlertCircle className="size-10 text-icon-muted" />
        <h1 className="text-lg font-semibold text-foreground">
          {dict.loadErrorTitle}
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          {dict.loadErrorSubtitle}
        </p>
        <Link
          href={profileHref}
          className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          {dict.reconfigureCta}
        </Link>
      </div>
    );
  }

  if (!resumeBookingId && calculationQuery.isPending) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const calculation = calculationQuery.data ?? null;
  const styleName = booking?.style_name ?? calculation?.style_name ?? "";
  const durationMinutes = booking?.duration_minutes ?? calculation?.duration_minutes;
  const appointmentLabel = formatSlotDateTime(startsAt, lang);
  const isMobile = booking?.is_mobile ?? calculation?.is_mobile ?? false;
  const clientAddress = booking?.client_address ?? calculation?.client_address ?? null;
  const locationValue = isMobile
    ? formatTemplate(dict.locationMobileValue, { address: clientAddress ?? "" })
    : formatTemplate(dict.locationInPersonValue, {
        name: braider.business_name ?? "",
      });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href={profileHref}
        onClick={(e) => {
          if (window.history.length > 1) {
            e.preventDefault();
            router.back();
          }
        }}
        className="w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {dict.backToProfile}
      </Link>

      {phase === "success" && booking ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center">
          <CheckCircle2 className="size-10 text-brand" />
          <h1 className="text-xl font-semibold text-foreground">
            {dict.successTitle}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {dict.successSubtitle}
          </p>
          <div className="mt-2 flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">{dict.referenceLabel}</span>
            <span className="font-mono text-base font-semibold text-foreground">
              {booking.reference}
            </span>
          </div>
          {booking.payment_schedule === "DEPOSIT_THEN_BALANCE" &&
            Number(booking.balance_amount) > 0 && (
              <p className="mt-2 max-w-sm text-xs text-muted-foreground">
                {formatTemplate(dict.balanceNotice, {
                  amount: `€${formatPrice(booking.balance_amount)}`,
                })}
              </p>
            )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href={profileHref}
              onClick={(e) => {
                if (window.history.length > 1) {
                  e.preventDefault();
                  router.back();
                }
              }}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
            >
              {dict.backToProfileCta}
            </Link>
            <Link
              href={`/${lang}`}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              {dict.backHomeCta}
            </Link>
          </div>
        </div>
      ) : phase === "confirming" || phase === "stillProcessing" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-8 text-center">
          <Loader className="size-8 animate-spin text-brand" />
          <h1 className="text-lg font-semibold text-foreground">
            {dict.confirmingPaymentTitle}
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {phase === "stillProcessing"
              ? dict.stillProcessingNotice
              : dict.confirmingPaymentSubtitle}
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-foreground">
            {dict.pageTitle}
          </h1>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              {braider.logo_url && (
                <span className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border bg-border/30">
                  <Image
                    src={braider.logo_url}
                    alt={braider.business_name ?? ""}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </span>
              )}
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-foreground">
                  {braider.business_name}
                </span>
                <span className="text-sm text-muted-foreground">{styleName}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {dict.appointmentLabel}
                </span>
                <span className="font-medium text-foreground">
                  {appointmentLabel}
                </span>
              </div>
              {durationMinutes != null && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {dict.durationLabel}
                  </span>
                  <span className="text-foreground">
                    {formatDurationMinutes(durationMinutes)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{dict.locationLabel}</span>
                <span className="text-right text-foreground">{locationValue}</span>
              </div>
            </div>

            {phase === "review" && calculation && (
              <div className="mt-4 border-t border-border pt-4">
                <PriceSummary
                  breakdown={calculation}
                  depositNote={calculation.deposit_note || dict.depositNoteFallback}
                  dict={dict}
                />
              </div>
            )}
            {phase === "payment" && booking && (
              <div className="mt-4 border-t border-border pt-4">
                <PriceSummary breakdown={booking} dict={dict} />
              </div>
            )}
          </div>

          {phase === "review" && (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                />
                <span className="text-sm text-foreground">{dict.termsLabel}</span>
              </label>

              <Button
                type="button"
                disabled={
                  !termsAccepted ||
                  createBookingMutation.isPending ||
                  sessionStatus !== "authenticated"
                }
                onClick={() => createBookingMutation.mutate()}
              >
                {createBookingMutation.isPending && (
                  <Loader className="size-4 animate-spin" />
                )}
                {createBookingMutation.isPending
                  ? dict.confirmButtonLoading
                  : dict.confirmButton}
              </Button>
            </div>
          )}

          {phase === "payment" && booking && (
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {dict.paymentTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dict.paymentSubtitle}
                </p>
              </div>
              {booking.payments[0]?.client_secret ? (
                <PaymentStep
                  clientSecret={booking.payments[0].client_secret}
                  amountLabel={`€${formatPrice(booking.payments[0].amount)}`}
                  returnUrl={`${window.location.origin}${profileHref}/book?calculation_id=${calculationId}&starts_at=${encodeURIComponent(startsAt)}&booking_id=${booking.id}`}
                  dict={dict}
                  onSubmitted={() => setPhase("confirming")}
                />
              ) : (
                <p className="text-sm text-red-500">
                  {dict.paymentErrorFallback}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
