"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, CreditCard, Info, ShieldCheck } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import type { BookingResponse } from "@/lib/api/types";
import { formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import { formatBookingDateTime } from "@/components/bookings/format";
import type { Locale } from "@/lib/i18n";
import type { BalanceRetryDict } from "@/components/bookings/types";
import { BalanceRetryModal } from "@/components/bookings/balance-retry-modal";

// Query params Stripe appends to return_url after a redirect-based payment
// method (PayPal); `balance_payment` is our own marker on that return_url.
const REDIRECT_PARAMS = [
  "balance_payment",
  "payment_intent",
  "payment_intent_client_secret",
  "redirect_status",
];

type BannerKind = "failed" | "processing" | "scheduled" | "abandoned" | null;

// The API never persists FAILED: a declined automatic charge goes back to
// SCHEDULED (next retry, with attempts > 0 and a last error) or, once the
// retry ladder runs out, to ABANDONED with the booking CANCELLED_NO_PAYMENT.
// A customer cancellation also sets ABANDONED, hence the status check.
function bannerKind(booking: BookingResponse): BannerKind {
  if (booking.payment_schedule !== "DEPOSIT_THEN_BALANCE") return null;
  const state = booking.balance_charge_state;
  if (state === "ABANDONED") {
    return booking.status === "CANCELLED_NO_PAYMENT" ? "abandoned" : null;
  }
  if (booking.status !== "CONFIRMED") return null;
  const hasFailure =
    booking.balance_charge_attempts > 0 &&
    !!(booking.balance_charge_last_error || booking.balance_charge_last_error_code);
  if ((state === "SCHEDULED" || state === "DUE" || state === "FAILED") && hasFailure) {
    return "failed";
  }
  if (state === "IN_PROGRESS" || state === "DUE") return "processing";
  if (state === "SCHEDULED") return "scheduled";
  return null;
}

function failureReason(code: string | null, dict: BalanceRetryDict): string {
  switch (code) {
    case "authentication_required":
      return dict.reasonAuthRequired;
    case "expired_card":
      return dict.reasonExpiredCard;
    case "insufficient_funds":
      return dict.reasonInsufficientFunds;
    case "card_declined":
      return dict.reasonCardDeclined;
    default:
      return dict.reasonGeneric;
  }
}

type ModalState = {
  initialPhase: "preparing" | "confirming";
  initialError: string | null;
};

export function BalanceRetryBanner({
  booking,
  lang,
  accessToken,
  dict,
}: {
  booking: BookingResponse;
  lang: Locale;
  accessToken: string;
  dict: BalanceRetryDict;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [justPaid, setJustPaid] = useState(false);

  // Coming back from PayPal (or another redirect-based method): resume in
  // the modal, then strip Stripe's params so a refresh doesn't replay it.
  useEffect(() => {
    if (searchParams.get("balance_payment") !== "1") return;
    const redirectStatus = searchParams.get("redirect_status");
    const succeeded = redirectStatus === "succeeded" || redirectStatus === "processing";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from the URL Stripe redirected back to
    setModal(
      succeeded
        ? { initialPhase: "confirming", initialError: null }
        : { initialPhase: "preparing", initialError: dict.redirectFailed }
    );
    const params = new URLSearchParams(searchParams.toString());
    REDIRECT_PARAMS.forEach((key) => params.delete(key));
    const search = params.toString() ? `?${params.toString()}` : "";
    router.replace(`${pathname}${search}`, { scroll: false });
  }, [searchParams, pathname, router, dict.redirectFailed]);

  const kind = bannerKind(booking);
  const amount = formatPrice(booking.balance_amount);
  const openPayment = () => setModal({ initialPhase: "preparing", initialError: null });

  const modalNode = modal && (
    <BalanceRetryModal
      booking={booking}
      lang={lang}
      accessToken={accessToken}
      dict={dict}
      initialPhase={modal.initialPhase}
      initialError={modal.initialError}
      onClose={() => setModal(null)}
      onPaid={() => setJustPaid(true)}
    />
  );

  if (justPaid && booking.balance_charge_state === "SUCCEEDED") {
    return (
      <>
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{dict.paidTitle}</p>
            <p className="mt-1">{dict.paidSubtitle}</p>
          </div>
        </div>
        {modalNode}
      </>
    );
  }

  if (kind === "abandoned") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        <AlertCircle className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">{dict.abandonedTitle}</p>
          <p className="mt-1">{dict.abandonedNotice}</p>
        </div>
      </div>
    );
  }

  if (kind === "scheduled") {
    return (
      <>
        <div className="flex flex-col gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 sm:flex-row sm:items-center sm:justify-between dark:bg-blue-950/40 dark:text-blue-200">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-5 shrink-0" />
            <p>
              {booking.balance_charge_due_at
                ? formatTemplate(dict.scheduledNotice, {
                    amount,
                    date: formatBookingDateTime(booking.balance_charge_due_at, lang),
                  })
                : formatTemplate(dict.modalAmount, { amount })}
            </p>
          </div>
          <button
            type="button"
            onClick={openPayment}
            className="shrink-0 self-start rounded-full px-3 py-1.5 text-sm font-semibold underline underline-offset-2 hover:bg-blue-100 sm:self-auto dark:hover:bg-blue-900/50"
          >
            {dict.payNowButton}
          </button>
        </div>
        {modalNode}
      </>
    );
  }

  if (kind === "processing") {
    return (
      <>
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          <div className="flex items-start gap-3">
            <Loader className="mt-0.5 size-5 shrink-0 animate-spin" />
            <div>
              <p className="font-semibold">{dict.processingTitle}</p>
              <p className="mt-1">{dict.processingSubtitle}</p>
            </div>
          </div>
          <div className="sm:pl-8">
            <Button type="button" variant="outline" onClick={openPayment} className="sm:w-auto">
              {dict.continuePaymentButton}
            </Button>
          </div>
        </div>
        {modalNode}
      </>
    );
  }

  if (kind === "failed") {
    const code = booking.balance_charge_last_error_code;
    const isAuthRequired = code === "authentication_required";
    const nextRetryAt =
      booking.balance_charge_state === "SCHEDULED" && booking.balance_charge_due_at
        ? booking.balance_charge_due_at
        : null;

    return (
      <>
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">{dict.failedTitle}</p>
              <p>{failureReason(code, dict)}</p>
              <p className="text-red-700 dark:text-red-300">
                {nextRetryAt
                  ? formatTemplate(dict.failedNextRetry, {
                      date: formatBookingDateTime(nextRetryAt, lang),
                    })
                  : dict.failedNoRetry}
              </p>
            </div>
          </div>
          <div className="sm:pl-8">
            <button
              type="button"
              onClick={openPayment}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
            >
              {isAuthRequired ? (
                <ShieldCheck className="size-4" />
              ) : (
                <CreditCard className="size-4" />
              )}
              {isAuthRequired
                ? dict.confirmPaymentButton
                : `${dict.updatePaymentButton} · €${amount}`}
            </button>
          </div>
        </div>
        {modalNode}
      </>
    );
  }

  return modalNode || null;
}
