"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

import { onboardingApi } from "@/lib/api/onboarding-client";
import type { PaymentSetupStatusResponse } from "@/lib/api/types";
import { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface PaymentSetupClientProps {
  dict: any;
  common: any;
  lang: Locale;
  initialStatus: PaymentSetupStatusResponse;
}

export function PaymentSetupClient({
  dict,
  common,
  lang,
  initialStatus,
}: PaymentSetupClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken as string;

  const [status] = useState(initialStatus);

  const startSetupMutation = useMutation({
    mutationFn: async () => {
      return onboardingApi.createAccountLink(token);
    },
    onSuccess: (data) => {
      toast.success(dict.toasts.started);
      window.location.href = data.onboarding_url;
    },
    onError: (err: any) => {
      if (err.code === "BRAIDER_COUNTRY_REQUIRED") {
        toast.error("Please set your country in the Service Location step first.");
      } else {
        toast.error(err.message || common.errors.validationError);
      }
    },
  });

  const handleContinue = () => {
    router.push(`/${lang}/onboarding`);
  };

  if (status.is_complete) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center space-y-6 pt-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-500">
          <CheckCircle2 className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {dict.toasts.success}
          </h1>
          <p className="text-muted-foreground">
            Your Stripe Connect account is fully set up and ready to receive payouts.
          </p>
        </div>
        <Button onClick={handleContinue} className="w-full">
          {dict.continue}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pt-4">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <CreditCard className="size-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {dict.title}
        </h1>
        <p className="text-muted-foreground">{dict.subtitle}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        {status.requirements_currently_due.length > 0 && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-4" />
              {dict.missingRequirements}
            </div>
            <ul className="mt-2 list-inside list-disc opacity-90">
              {status.requirements_currently_due.map((req) => (
                <li key={req} className="font-mono text-xs">
                  {req.replace(/_/g, " ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status.disabled_reason && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-4" />
              Account Restricted
            </div>
            <p className="mt-1 opacity-90">{status.disabled_reason}</p>
          </div>
        )}

        <Button
          onClick={() => startSetupMutation.mutate()}
          disabled={startSetupMutation.isPending}
          className="w-full py-6 text-lg"
        >
          {dict.connectButton}
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          You will be redirected to Stripe to securely complete your payment profile.
        </p>
      </div>
    </div>
  );
}
