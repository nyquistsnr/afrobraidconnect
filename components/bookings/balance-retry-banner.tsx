"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CalendarClock, CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";
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
        <BalanceNotice
          tone="success"
          role="status"
          icon={<CheckCircle2 className="size-5" />}
          title={dict.paidTitle}
        >
          {dict.paidSubtitle}
        </BalanceNotice>
        {modalNode}
      </>
    );
  }

  if (kind === "abandoned") {
    return (
      <BalanceNotice
        tone="danger"
        icon={<AlertCircle className="size-5" />}
        title={dict.abandonedTitle}
      >
        {dict.abandonedNotice}
      </BalanceNotice>
    );
  }

  if (kind === "scheduled") {
    return (
      <>
        <BalanceNotice
          tone="neutral"
          icon={<CalendarClock className="size-5" />}
          title={formatTemplate(dict.scheduledTitle, { amount })}
          action={
            <Button type="button" onClick={openPayment} className="sm:w-auto sm:px-5">
              {dict.payNowButton}
            </Button>
          }
        >
          {booking.balance_charge_due_at
            ? formatTemplate(dict.scheduledSubtitle, {
                date: formatBookingDateTime(booking.balance_charge_due_at, lang),
              })
            : null}
        </BalanceNotice>
        {modalNode}
      </>
    );
  }

  if (kind === "processing") {
    return (
      <>
        <BalanceNotice
          tone="warning"
          role="status"
          stacked
          icon={<Loader className="size-5 animate-spin" />}
          title={dict.processingTitle}
          action={
            <Button type="button" variant="outline" onClick={openPayment} className="sm:w-auto sm:px-5">
              {dict.continuePaymentButton}
            </Button>
          }
        >
          {dict.processingSubtitle}
        </BalanceNotice>
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
        <BalanceNotice
          tone="danger"
          role="alert"
          stacked
          icon={<AlertCircle className="size-5" />}
          title={dict.failedTitle}
          action={
            <button
              type="button"
              onClick={openPayment}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
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
          }
        >
          <span className="block font-medium text-foreground">{failureReason(code, dict)}</span>
          <span className="mt-1 block">
            {nextRetryAt
              ? formatTemplate(dict.failedNextRetry, {
                  date: formatBookingDateTime(nextRetryAt, lang),
                })
              : dict.failedNoRetry}
          </span>
        </BalanceNotice>
        {modalNode}
      </>
    );
  }

  return modalNode || null;
}

type NoticeTone = "neutral" | "success" | "warning" | "danger";

// Theme-agnostic on purpose: the app's light/dark switch sets data-theme,
// which Tailwind's `dark:` variant doesn't follow, so colors here are the
// surface/foreground tokens plus translucent status tints (the same
// `-500/10` + `-600` pairing the booking status badge uses), which read
// correctly on either background.
const NOTICE_TONES: Record<NoticeTone, { card: string; icon: string }> = {
  neutral: { card: "border-border bg-surface", icon: "bg-brand/10 text-brand" },
  success: { card: "border-emerald-500/30 bg-emerald-500/5", icon: "bg-emerald-500/15 text-emerald-500" },
  warning: { card: "border-amber-500/30 bg-amber-500/5", icon: "bg-amber-500/15 text-amber-500" },
  danger: { card: "border-red-500/30 bg-red-500/5", icon: "bg-red-500/15 text-red-500" },
};

function BalanceNotice({
  tone,
  icon,
  title,
  children,
  action,
  role,
  stacked = false,
}: {
  tone: NoticeTone;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  role?: "status" | "alert";
  // Puts the action under the text (aligned with it) - for longer copy that
  // would otherwise be squeezed next to the button on wider screens.
  stacked?: boolean;
}) {
  const styles = NOTICE_TONES[tone];
  return (
    <div
      role={role}
      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:p-5 ${stacked ? "" : "sm:flex-row sm:items-center"} ${styles.card}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${styles.icon}`}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="font-semibold text-foreground">{title}</p>
          {children && <p className="mt-1 text-sm text-muted-foreground">{children}</p>}
        </div>
      </div>
      {action && <div className={`shrink-0 ${stacked ? "sm:pl-13" : ""}`}>{action}</div>}
    </div>
  );
}
