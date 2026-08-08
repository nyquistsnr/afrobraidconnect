"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
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
import type { BookingDetailDict, BookingStatusDict } from "@/components/bookings/types";

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
}: {
  bookingId: string;
  lang: Locale;
  dict: BookingDetailDict;
  statusDict: BookingStatusDict;
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
    queryFn: () => bookingsApi.getById(accessToken!, bookingId),
    enabled: sessionStatus === "authenticated" && !!accessToken,
    retry: false,
  });
  const now = useMemo(() => new Date(), []);

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
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
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

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-xl font-semibold text-foreground">
              {booking.style_name}
            </h1>
            <p className="text-sm text-muted-foreground">{booking.braider_name}</p>
          </div>
          <BookingStatusBadge status={booking.status} dict={statusDict} />
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
    </div>
  );
}
