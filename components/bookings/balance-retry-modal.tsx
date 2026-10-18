"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeError,
} from "@stripe/stripe-js";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api/auth-client";
import { balanceClientSecret, bookingsApi } from "@/lib/api/bookings-client";
import type { BookingResponse } from "@/lib/api/types";
import { formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import type { Locale } from "@/lib/i18n";
import type { BalanceRetryDict } from "@/components/bookings/types";

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Loaded once per browser session.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> | null {
  if (!STRIPE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(STRIPE_KEY);
  return stripePromise;
}

// The balance only flips to SUCCEEDED once Stripe's payment_intent.succeeded
// webhook reaches the API, so a confirmed payment is polled for a while
// before falling back to the reassuring "still processing" state.
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

export type BalancePaymentPhase =
  | "preparing"
  | "payment"
  | "confirming"
  | "stillProcessing"
  | "success"
  | "blocked";

// Errors from POST /bookings/{id}/pay. BOOKING_PAYMENT_NOT_RESUMABLE is
// resolved separately (already paid vs. an automatic charge in flight).
function prepareErrorMessage(err: unknown, dict: BalanceRetryDict): string {
  if (!(err instanceof ApiError)) return dict.errorGeneric;
  if (err.code === "NETWORK_ERROR") return dict.errorNetwork;
  if (err.code === "STRIPE_API_UNAVAILABLE") return dict.errorProviderUnavailable;
  return dict.errorGeneric;
}

// Card errors come back already localized (Elements gets `locale`), so their
// own message is the most specific thing to show; everything else maps to
// our own copy. Validation errors are rendered inline by the PaymentElement.
function confirmErrorMessage(error: StripeError, dict: BalanceRetryDict): string | null {
  if (error.type === "validation_error") return null;
  if (error.code === "payment_intent_authentication_failure") return dict.errorAuthFailed;
  if (error.type === "card_error") return error.message ?? dict.errorDeclined;
  if (error.type === "api_connection_error") return dict.errorNetwork;
  return dict.errorGeneric;
}

function PayForm({
  amountLabel,
  returnUrl,
  dict,
  initialError,
  onConfirmed,
  onSubmittingChange,
  onCancel,
}: {
  amountLabel: string;
  returnUrl: string;
  dict: BalanceRetryDict;
  initialError: string | null;
  onConfirmed: () => void;
  onSubmittingChange: (submitting: boolean) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  function setBusy(busy: boolean) {
    setSubmitting(busy);
    onSubmittingChange(busy);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setBusy(true);
    setError(null);

    // redirect: "if_required" keeps card payments (including the 3-D Secure
    // challenge, which Stripe shows in its own overlay) on this page; PayPal
    // and other redirect-based methods come back via return_url, which the
    // banner picks up.
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (confirmError) {
      // e.g. payment_intent_unexpected_state after a double submit — the
      // intent already went through, so treat it as confirmed.
      if (confirmError.payment_intent?.status === "succeeded") {
        onConfirmed();
        return;
      }
      setError(confirmErrorMessage(confirmError, dict));
      setBusy(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onConfirmed();
      return;
    }

    setError(dict.errorDeclined);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="sm:w-auto"
        >
          {dict.cancelButton}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements}
          loading={submitting}
          className="sm:w-auto"
        >
          {submitting
            ? dict.payButtonLoading
            : formatTemplate(dict.payButton, { amount: amountLabel })}
        </Button>
      </div>
    </form>
  );
}

export function BalanceRetryModal({
  booking,
  lang,
  accessToken,
  dict,
  initialPhase,
  initialError = null,
  onClose,
  onPaid,
}: {
  booking: BookingResponse;
  lang: Locale;
  accessToken: string;
  dict: BalanceRetryDict;
  // "preparing" starts a fresh /pay round-trip; "confirming" resumes after a
  // redirect-based payment method (PayPal) came back succeeded.
  initialPhase: "preparing" | "confirming";
  initialError?: string | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  const queryClient = useQueryClient();
  const stripe = getStripe();
  const [phase, setPhase] = useState<BalancePaymentPhase>(
    stripe ? initialPhase : "blocked"
  );
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    stripe ? null : dict.paymentsNotConfigured
  );
  const [canRetry, setCanRetry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const amountLabel = formatPrice(booking.balance_amount);
  const bookingId = booking.id;
  const returnUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/${lang}/bookings/${bookingId}?balance_payment=1`;

  function storeBooking(latest: BookingResponse) {
    queryClient.setQueryData(["booking", bookingId], latest);
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  }

  // Starts (or resumes) the on-session PaymentIntent. Re-runs when the
  // customer hits "Try again" after a failed preparation.
  useEffect(() => {
    if (phase !== "preparing") return;
    let cancelled = false;

    async function prepare() {
      try {
        const updated = await bookingsApi.pay(accessToken, lang, bookingId);
        if (cancelled) return;
        const secret = balanceClientSecret(updated);
        // The banner should reflect the now IN_PROGRESS charge if the
        // customer closes this without paying.
        queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
        if (!secret) {
          setMessage(dict.errorGeneric);
          setCanRetry(true);
          setPhase("blocked");
          return;
        }
        setClientSecret(secret);
        setPhase("payment");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "BOOKING_PAYMENT_NOT_RESUMABLE") {
          try {
            const latest = await bookingsApi.getById(accessToken, lang, bookingId);
            if (cancelled) return;
            storeBooking(latest);
            if (latest.balance_charge_state === "SUCCEEDED") {
              setMessage(dict.errorAlreadyPaid);
              setPhase("success");
              onPaid();
              return;
            }
          } catch {
            // Fall through to the in-progress message.
          }
          if (cancelled) return;
          setMessage(dict.errorInProgress);
          setCanRetry(false);
          setPhase("blocked");
          return;
        }
        setMessage(prepareErrorMessage(err, dict));
        setCanRetry(true);
        setPhase("blocked");
      }
    }

    prepare();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt]);

  // Waits for the webhook to mark the balance SUCCEEDED.
  useEffect(() => {
    if (phase !== "confirming") return;
    let cancelled = false;
    const startedAt = Date.now();

    async function poll() {
      while (!cancelled && Date.now() - startedAt < POLL_TIMEOUT_MS) {
        try {
          const latest = await bookingsApi.getById(accessToken, lang, bookingId);
          if (cancelled) return;
          storeBooking(latest);
          if (latest.balance_charge_state === "SUCCEEDED") {
            setPhase("success");
            onPaid();
            return;
          }
        } catch {
          // Transient — keep polling until the timeout.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (!cancelled) setPhase("stillProcessing");
    }

    poll();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleRetry() {
    setMessage(null);
    setPhase("preparing");
    setAttempt((n) => n + 1);
  }

  // Closing mid-confirmation could abandon a 3-D Secure challenge.
  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <Modal open onClose={handleClose} labelledBy="balance-payment-title" size="sm">
      <div className="flex items-start justify-between gap-4 pb-4">
        <div className="flex flex-col gap-1">
          <h2 id="balance-payment-title" className="text-lg font-semibold text-foreground">
            {dict.modalTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatTemplate(dict.modalAmount, { amount: amountLabel })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={submitting}
          className="-mr-1 -mt-1 rounded-full p-1 text-icon-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          aria-label={dict.closeButton}
        >
          <X className="size-5" />
        </button>
      </div>

      {phase === "preparing" && (
        <div
          className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground"
          role="status"
        >
          <Loader className="size-6 animate-spin" />
          {dict.modalPreparing}
        </div>
      )}

      {phase === "payment" && stripe && clientSecret && (
        <Elements
          stripe={stripe}
          options={{ clientSecret, locale: lang }}
        >
          <PayForm
            amountLabel={amountLabel}
            returnUrl={returnUrl}
            dict={dict}
            initialError={initialError}
            onConfirmed={() => {
              setSubmitting(false);
              setPhase("confirming");
            }}
            onSubmittingChange={setSubmitting}
            onCancel={onClose}
          />
        </Elements>
      )}

      {phase === "confirming" && (
        <div
          className="flex flex-col items-center gap-3 py-8 text-center"
          role="status"
        >
          <Loader className="size-7 animate-spin text-brand" />
          <p className="font-semibold text-foreground">{dict.confirmingTitle}</p>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.confirmingSubtitle}</p>
        </div>
      )}

      {(phase === "stillProcessing" || phase === "success") && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="size-10 text-emerald-600" />
          <p className="font-semibold text-foreground">
            {phase === "success" ? dict.successTitle : dict.stillProcessingTitle}
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {phase === "stillProcessing"
              ? dict.stillProcessingSubtitle
              : message ?? formatTemplate(dict.successSubtitle, { amount: amountLabel })}
          </p>
          <Button type="button" onClick={onClose} className="mt-2">
            {dict.closeButton}
          </Button>
        </div>
      )}

      {phase === "blocked" && (
        <div className="flex flex-col gap-4">
          <p role="alert" className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{message ?? dict.errorGeneric}</span>
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="sm:w-auto">
              {dict.closeButton}
            </Button>
            {canRetry && (
              <Button type="button" onClick={handleRetry} className="sm:w-auto">
                {dict.retryButton}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
