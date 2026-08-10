"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type {
  BookingLineItemType,
  PaymentPurpose,
  PaymentStatus,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import { bookingsApi } from "@/lib/api/bookings-client";
import {
  formatBookingDateOnly,
  formatBookingDateTime,
  formatBookingDuration,
} from "@/components/bookings/format";
import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { BalanceRetryBanner } from "@/components/bookings/balance-retry-banner";
import { ReviewModal } from "@/components/reviews/review-modal";
import { braidersApi } from "@/lib/api/braiders-client";
import { Star } from "lucide-react";
import { ChatButton } from "@/components/chat/chat-button";
import type { ChatButtonDict } from "@/components/chat/types";
import type { BookingDetailDict, BookingStatusDict } from "@/components/bookings/types";
import type { Dictionary } from "@/app/[lang]/dictionaries";

// Every status except these implies a successful deposit/full payment went
// through — chat stays available even after cancellation (matches the API
// doc's "gate the Chat button on booking status instead" guidance).
const CHAT_UNAVAILABLE_STATUSES = new Set([
  "PENDING_PAYMENT",
  "EXPIRED",
  "CANCELLED_NO_PAYMENT",
]);

// TRAVEL/PLATFORM_FEE/VAT_* items duplicate the response's own flat total
// fields (platform_fee, vat_total, ...) — only the service-side items are
// itemized here, the fee/tax breakdown below uses the flat fields instead
// of re-deriving them from this list.
const ITEMIZED_TYPES = new Set<BookingLineItemType>([
  "SERVICE",
  "VARIATION",
  "ADDON",
  "TRAVEL",
]);

export function BookingDetailView({
  bookingId,
  lang,
  dict,
  statusDict,
  reviewsDict,
  chatButtonDict,
  errorsDict,
}: {
  bookingId: string;
  lang: Locale;
  dict: BookingDetailDict;
  statusDict: BookingStatusDict;
  reviewsDict: Dictionary["reviews"];
  chatButtonDict: ChatButtonDict;
  errorsDict: Dictionary["common"]["errors"];
}) {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const bookingsHref = `/${lang}/bookings`;

  const {
    data: booking,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingsApi.getById(accessToken!, lang, bookingId),
    enabled: sessionStatus === "authenticated" && !!accessToken,
    retry: false,
  });
  const now = useMemo(() => new Date(), []);

  const isEligibleForReview =
    booking?.status === "CONFIRMED" || booking?.status === "COMPLETED";

  const { data: myReview } = useQuery({
    queryKey: ["my-review", booking?.braider_id],
    queryFn: () => braidersApi.getMyReview(booking!.braider_id, accessToken!, lang),
    enabled: isEligibleForReview && !!accessToken && !!booking,
    retry: false, // 404 means no review yet
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <AlertCircle className="size-10 text-icon-muted" />
        <h1 className="text-lg font-semibold text-foreground">{dict.loadErrorTitle}</h1>
        <p className="max-w-xs text-sm text-muted-foreground">{dict.loadErrorSubtitle}</p>
        <Link
          href={bookingsHref}
          className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          {dict.backToBookingsCta}
        </Link>
      </div>
    );
  }

  if (isLoading || !booking) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const includedItems = booking.items.filter((item) => ITEMIZED_TYPES.has(item.item_type));
  const depositAmount = Number(booking.deposit_amount);
  const total = Number(booking.total);
  const hasSplit = depositAmount > 0 && depositAmount < total;
  const isCancellableStatus =
    booking.status === "PENDING_PAYMENT" || booking.status === "CONFIRMED";
  const cancellable =
    isCancellableStatus && new Date(booking.cancellation_cutoff_at).getTime() > now.getTime();

  const locationValue = booking.is_mobile
    ? formatTemplate(dict.locationMobileValue, { address: booking.client_address ?? "" })
    : formatTemplate(dict.locationInPersonValue, { name: booking.braider_name });

  const purposeLabel: Record<PaymentPurpose, string> = {
    FULL: dict.paymentPurposeFull,
    DEPOSIT: dict.paymentPurposeDeposit,
    BALANCE: dict.paymentPurposeBalance,
  };
  const paymentStatusLabel: Record<PaymentStatus, string> = {
    PENDING: dict.paymentStatusPending,
    SUCCEEDED: dict.paymentStatusSucceeded,
    FAILED: dict.paymentStatusFailed,
    CANCELED: dict.paymentStatusCanceled,
  };
  const paymentStatusColor: Record<PaymentStatus, string> = {
    PENDING: "text-amber-600",
    SUCCEEDED: "text-emerald-600",
    FAILED: "text-red-600",
    CANCELED: "text-muted-foreground",
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href={bookingsHref}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {dict.backToBookings}
      </Link>

      <BalanceRetryBanner
        booking={booking}
        lang={lang}
        accessToken={accessToken!}
        dict={dict.balanceRetry}
      />

      {isEligibleForReview && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-brand/5 p-4 sm:p-5">
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-foreground">
              {myReview ? reviewsDict.title : reviewsDict.rateYourBraider}
            </span>
            <span className="text-muted-foreground">
              {myReview
                ? myReview.status === "PENDING"
                  ? reviewsDict.pendingApproval
                  : "Thank you for your feedback!"
                : "Help others by sharing your experience."}
            </span>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            {myReview ? reviewsDict.editReview : reviewsDict.leaveReview}
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-xl font-semibold text-foreground">
              {booking.style_name}
            </h1>
            <p className="text-sm text-muted-foreground">{booking.braider_name}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <BookingStatusBadge status={booking.status} dict={statusDict} />
            {!CHAT_UNAVAILABLE_STATUSES.has(booking.status) && (
              <ChatButton
                bookingId={booking.id}
                lang={lang}
                accessToken={accessToken!}
                dict={chatButtonDict}
                errorsDict={errorsDict}
              />
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>
            {dict.referenceLabel}: <span className="font-mono text-foreground">{booking.reference}</span>
          </span>
          <span aria-hidden>·</span>
          <span>
            {dict.bookedOnLabel} {formatBookingDateOnly(booking.created_at, lang)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.appointmentLabel}</span>
            <span className="font-medium text-foreground">
              {formatBookingDateTime(booking.starts_at, lang)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.durationLabel}</span>
            <span className="text-foreground">
              {formatBookingDuration(booking.duration_minutes, dict)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{dict.locationLabel}</span>
            <span className="text-right text-foreground">{locationValue}</span>
          </div>
        </div>
        <Link
          href={`/${lang}/braiders/${booking.braider_id}`}
          className="mt-4 inline-flex w-fit items-center text-sm font-semibold text-foreground underline underline-offset-2 hover:text-brand"
        >
          {dict.viewProfileCta}
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold text-foreground">{dict.includedTitle}</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {includedItems.map((item, index) => (
            <div key={`${item.item_type}-${index}`} className="flex items-center justify-between gap-4">
              <span className="text-foreground">{item.name ?? item.item_type}</span>
              <span className="shrink-0 text-muted-foreground">
                €{formatPrice(item.line_amount)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.subtotalLabel}</span>
            <span className="text-foreground">€{formatPrice(booking.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.platformFeeLabel}</span>
            <span className="text-foreground">+€{formatPrice(booking.platform_fee)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.vatLabel}</span>
            <span className="text-foreground">+€{formatPrice(booking.vat_total)}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-semibold text-foreground">
          <span>{dict.totalLabel}</span>
          <span>€{formatPrice(booking.total)}</span>
        </div>
        {hasSplit && (
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>{dict.depositPaidLabel}</span>
              <span>€{formatPrice(booking.deposit_amount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{dict.balanceLabel}</span>
              <span>€{formatPrice(booking.balance_amount)}</span>
            </div>
          </div>
        )}
      </div>

      {booking.payments.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">{dict.paymentsTitle}</h2>
          <div className="mt-3 flex flex-col gap-2.5 text-sm">
            {booking.payments.map((payment, index) => (
              <div key={`${payment.purpose}-${index}`} className="flex items-center justify-between">
                <span className="text-foreground">{purposeLabel[payment.purpose]}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">€{formatPrice(payment.amount)}</span>
                  <span className={`text-xs font-semibold ${paymentStatusColor[payment.status]}`}>
                    {paymentStatusLabel[payment.status]}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancellableStatus && (
        <div className="rounded-2xl border border-border/70 bg-border/10 p-4 text-sm">
          <p className="font-semibold text-foreground">{dict.cancellationTitle}</p>
          <p className="mt-1 text-muted-foreground">
            {cancellable
              ? formatTemplate(dict.cancellationBeforeCutoff, {
                  date: formatBookingDateTime(booking.cancellation_cutoff_at, lang),
                })
              : dict.cancellationAfterCutoff}
          </p>
        </div>
      )}

      {isEligibleForReview && booking && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          braiderId={booking.braider_id}
          accessToken={accessToken!}
          initialReview={myReview ?? null}
          lang={lang}
          dict={reviewsDict}
        />
      )}
    </div>
  );
}
