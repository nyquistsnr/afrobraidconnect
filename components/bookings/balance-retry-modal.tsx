"use client";

import { useState, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { bookingsApi } from "@/lib/api/bookings-client";
import type { BalanceRetryDict } from "@/components/bookings/types";

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Loaded once per browser session.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> | null {
  if (!STRIPE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(STRIPE_KEY);
  return stripePromise;
}

function RetryForm({
  bookingId,
  accessToken,
  dict,
  onSuccess,
  onClose,
}: {
  bookingId: string;
  accessToken: string;
  dict: BalanceRetryDict;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    // 1. Confirm setup intent to collect the new card without charging it directly.
    const { setupIntent, error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href, // If redirect happens
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? dict.errorModalTitle);
      setSubmitting(false);
      return;
    }

    if (!setupIntent?.payment_method) {
      setError("Failed to obtain payment method.");
      setSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;

    // 2. Pass the new card to our backend to retry the balance charge.
    try {
      const response = await bookingsApi.pay(
        accessToken,
        bookingId,
        paymentMethodId
      );

      // 3. Handle 3D-Secure challenge if required.
      if (response.status === "PENDING" && response.client_secret) {
        const { error: piError } = await stripe.confirmCardPayment(
          response.client_secret
        );
        if (piError) {
          setError(piError.message ?? dict.errorModalTitle);
          setSubmitting(false);
          return;
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message ?? dict.errorModalTitle);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || !elements || submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Processing..." : dict.confirmPaymentButton}
        </Button>
      </div>
    </form>
  );
}

export function BalanceRetryModal({
  open,
  onClose,
  clientSecret,
  bookingId,
  accessToken,
  dict,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  clientSecret: string;
  bookingId: string;
  accessToken: string;
  dict: BalanceRetryDict;
  onSuccess: () => void;
}) {
  const stripe = getStripe();

  return (
    <Modal open={open} onClose={onClose} labelledBy="retry-modal-title" size="sm">
      <div className="flex items-center justify-between pb-4">
        <h2 id="retry-modal-title" className="text-lg font-semibold text-foreground">
          {dict.addCardButton}
        </h2>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-icon-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </button>
      </div>
      
      {!stripe ? (
        <p className="text-sm text-red-500">
          Payments aren&apos;t configured yet — missing Stripe publishable key.
        </p>
      ) : (
        <Elements stripe={stripe} options={{ clientSecret }}>
          <RetryForm
            bookingId={bookingId}
            accessToken={accessToken}
            dict={dict}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </Elements>
      )}
    </Modal>
  );
}
