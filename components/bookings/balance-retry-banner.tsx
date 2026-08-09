"use client";

import { useState } from "react";
import { AlertCircle, CreditCard, Info } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useQueryClient } from "@tanstack/react-query";
import type { BookingResponse } from "@/lib/api/types";
import { formatTemplate } from "@/lib/format-template";
import { bookingsApi } from "@/lib/api/bookings-client";
import { formatBookingDateOnly } from "@/components/bookings/format";
import type { Locale } from "@/lib/i18n";
import type { BalanceRetryDict } from "@/components/bookings/types";
import { BalanceRetryModal } from "@/components/bookings/balance-retry-modal";

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
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(null);
  const [isStartingFlow, setIsStartingFlow] = useState(false);

  const { balance_charge_state } = booking;

  async function handleAddCard() {
    setIsStartingFlow(true);
    try {
      const { client_secret } = await bookingsApi.setupIntent(accessToken, booking.id);
      setSetupClientSecret(client_secret);
      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingFlow(false);
    }
  }

  async function handleConfirmPayment() {
    setIsStartingFlow(true);
    try {
      const response = await bookingsApi.pay(accessToken, booking.id);
      
      if (response.status === "PENDING" && response.client_secret) {
        const { loadStripe } = await import("@stripe/stripe-js");
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
        if (stripe) {
          await stripe.confirmCardPayment(response.client_secret);
          queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
        }
      } else if (response.status === "SUCCEEDED") {
        queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingFlow(false);
    }
  }

  function handleSuccess() {
    setIsModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ["booking", booking.id] });
  }

  if (
    balance_charge_state === "NOT_APPLICABLE" || 
    balance_charge_state === "SUCCEEDED" || 
    balance_charge_state === "IN_PROGRESS" || 
    balance_charge_state === "DUE" ||
    !balance_charge_state
  ) {
    return null;
  }

  if (balance_charge_state === "SCHEDULED" && booking.balance_charge_due_at) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Info className="size-5 shrink-0" />
        <p>
          {formatTemplate(dict.happyPathNotice, {
            amount: booking.balance_amount,
            date: formatBookingDateOnly(booking.balance_charge_due_at, lang)
          })}
        </p>
      </div>
    );
  }

  if (balance_charge_state === "ABANDONED") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
        <AlertCircle className="size-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">{dict.errorModalTitle}</p>
          <p className="mt-1">{dict.abandonedNotice}</p>
        </div>
      </div>
    );
  }

  if (balance_charge_state === "FAILED") {
    // If there is an authentication_required error, we should highlight the confirm payment button
    const isAuthRequired = booking.balance_charge_last_error?.toLowerCase().includes("authenticat") 
      || booking.balance_charge_last_error?.toLowerCase().includes("confirm");

    return (
      <>
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{dict.failedBannerText}</p>
              {booking.balance_charge_last_error && (
                <p className="mt-1">{booking.balance_charge_last_error}</p>
              )}
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-3 sm:ml-8">
            {!isAuthRequired && (
              <button
                onClick={handleAddCard}
                disabled={isStartingFlow}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isStartingFlow ? <Loader className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                {dict.addCardButton}
              </button>
            )}
            <button
              onClick={handleConfirmPayment}
              disabled={isStartingFlow}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors disabled:opacity-50 ${
                isAuthRequired 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "bg-red-100 text-red-800 hover:bg-red-200"
              }`}
            >
              {isStartingFlow && isAuthRequired && <Loader className="size-4 animate-spin" />}
              {dict.confirmPaymentButton}
            </button>
          </div>
        </div>

        {isModalOpen && setupClientSecret && (
          <BalanceRetryModal
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            clientSecret={setupClientSecret}
            bookingId={booking.id}
            accessToken={accessToken}
            dict={dict}
            onSuccess={handleSuccess}
          />
        )}
      </>
    );
  }

  return null;
}
