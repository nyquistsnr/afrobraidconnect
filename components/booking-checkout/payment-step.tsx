"use client";

import { useState, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { formatTemplate } from "@/lib/format-template";
import { Button } from "@/components/ui/button";
import type { BookingCheckoutDict } from "@/components/booking-checkout/types";

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Loaded once per browser session, not per render/mount.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> | null {
  if (!STRIPE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(STRIPE_KEY);
  return stripePromise;
}

function PayForm({
  amountLabel,
  returnUrl,
  dict,
  onSubmitted,
}: {
  amountLabel: string;
  returnUrl: string;
  dict: BookingCheckoutDict;
  onSubmitted: () => void;
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

    // redirect: "if_required" keeps the customer on this page for the
    // common case (cards); Stripe still navigates away via return_url for
    // payment methods that require an off-site step, and the checkout view
    // resumes from ?booking_id= when that happens.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? dict.paymentErrorFallback);
      setSubmitting(false);
      return;
    }

    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={!stripe || !elements || submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        {submitting
          ? dict.payButtonLoading
          : formatTemplate(dict.payButton, { amount: amountLabel })}
      </Button>
    </form>
  );
}

export function PaymentStep({
  clientSecret,
  amountLabel,
  returnUrl,
  dict,
  onSubmitted,
}: {
  clientSecret: string;
  amountLabel: string;
  returnUrl: string;
  dict: BookingCheckoutDict;
  onSubmitted: () => void;
}) {
  const stripe = getStripe();

  if (!stripe) {
    return (
      <p className="text-sm text-red-500">
        Payments aren&apos;t configured yet — missing Stripe publishable key.
      </p>
    );
  }

  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <PayForm
        amountLabel={amountLabel}
        returnUrl={returnUrl}
        dict={dict}
        onSubmitted={onSubmitted}
      />
    </Elements>
  );
}
