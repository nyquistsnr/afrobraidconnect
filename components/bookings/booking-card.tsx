"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BookingSummary } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/braider-pricing";
import { formatBookingDateTime } from "@/components/bookings/format";
import { BookingStatusBadge } from "@/components/bookings/status-badge";
import type { BookingsListDict, BookingStatusDict } from "@/components/bookings/types";

export function BookingCard({
  booking,
  lang,
  dict,
  statusDict,
}: {
  booking: BookingSummary;
  lang: Locale;
  dict: BookingsListDict;
  statusDict: BookingStatusDict;
}) {
  const now = new Date();
  const startsAt = new Date(booking.starts_at);
  const isCancellable = startsAt.getTime() - now.getTime() > 24 * 60 * 60 * 1000;

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-border/70 p-4 transition-all hover:border-foreground/25 hover:shadow-sm sm:p-5 sm:flex-row sm:items-center sm:justify-between">
      <Link href={`/${lang}/bookings/${booking.id}`} className="absolute inset-0 z-0">
        <span className="sr-only">View booking</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} dict={statusDict} />
          <span className="truncate text-xs text-muted-foreground">
            {dict.referencePrefix} {booking.reference}
          </span>
        </div>
        <p className="truncate font-semibold text-foreground">{booking.style_name}</p>
        <p className="truncate text-sm text-muted-foreground">{booking.braider_name}</p>
        <p className="text-sm text-foreground">
          {formatBookingDateTime(booking.starts_at, lang)}
        </p>
      </div>
      <div className="flex shrink-0 items-center justify-between sm:justify-end gap-2 sm:gap-4 relative z-10">
        {isCancellable && booking.status === "CONFIRMED" && (
          <Link
            href={`/${lang}/bookings/${booking.id}?reschedule=true`}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-border/40"
          >
            {dict.rescheduleButton}
          </Link>
        )}
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="text-right font-semibold text-foreground">
            €{formatPrice(booking.total)}
          </span>
          <ChevronRight className="size-4 shrink-0 text-icon-muted transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
