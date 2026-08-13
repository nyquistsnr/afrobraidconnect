"use client";

import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Loader } from "@/components/ui/loader";
import type { BookingResponse } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { ApiError } from "@/lib/api/auth-client";
import { bookingsApi } from "@/lib/api/bookings-client";
import type { BookingCheckoutDict } from "@/components/booking-checkout/types";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

// Errors where the payment row is now terminal (FAILED) or the request
// itself can never succeed — the customer has to start over with a new
// booking, not retry this capture call.
const TERMINAL_ERROR_CODES = new Set([
  "BOOKING_NOT_FOUND",
  "BOOKING_PAYMENT_NOT_FOUND",
  "BOOKING_PAYMENT_NOT_CAPTURABLE",
  "PAYPAL_PAYMENT_DECLINED",
]);

type ErrorsDict = Dictionary["common"]["errors"];

export function PayPalPaymentStep({
  orderId,
  bookingId,
  accessToken,
  lang,
  dict,
  errorsDict,
  onCaptured,
}: {
  orderId: string;
  bookingId: string;
  accessToken: string;
  lang: Locale;
  dict: BookingCheckoutDict;
  errorsDict: ErrorsDict;
  onCaptured: (booking: BookingResponse) => void;
}) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminal, setTerminal] = useState(false);

  if (!PAYPAL_CLIENT_ID) {
    return (
      <p className="text-sm text-red-500">{dict.paymentErrorFallback}</p>
    );
  }

  async function capture() {
    setCapturing(true);
    setError(null);
    try {
      const booking = await bookingsApi.capturePaypal(accessToken, lang, bookingId);
      onCaptured(booking);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined;
      setError(getAuthErrorMessage(code, errorsDict));
      setTerminal(!!code && TERMINAL_ERROR_CODES.has(code));
      setCapturing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!terminal && (
        <PayPalScriptProvider
          options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", intent: "capture" }}
        >
          <PayPalButtons
            disabled={capturing}
            style={{ layout: "vertical" }}
            createOrder={() => Promise.resolve(orderId)}
            onApprove={() => capture()}
            onError={() => setError(dict.paymentErrorFallback)}
          />
        </PayPalScriptProvider>
      )}

      {capturing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="size-4 animate-spin" />
          {dict.payButtonLoading}
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-red-500">{error}</p>
          {!terminal && (
            <button
              type="button"
              onClick={() => capture()}
              className="w-fit text-sm font-semibold text-brand underline-offset-2 hover:underline"
            >
              {dict.retryButton}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
