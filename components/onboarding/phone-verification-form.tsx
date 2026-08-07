"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { PhoneInput } from "@/components/ui/phone-input";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";

export function PhoneVerificationForm({
  dict,
  common,
  lang,
  defaultPhoneNumber,
}: {
  dict: Dictionary["onboarding"]["phoneVerification"];
  common: Dictionary["common"];
  lang: Locale;
  defaultPhoneNumber: string | null;
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const [phone, setPhone] = useState<string | undefined>(
    defaultPhoneNumber ?? undefined
  );
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");

  const sendCodeMutation = useMutation({
    mutationFn: () =>
      onboardingApi.sendPhoneCode(session!.accessToken, {
        phone_number: phone!,
      }),
    onSuccess: () => {
      toast.success(dict.toasts.codeSent);
      setStep("code");
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () =>
      onboardingApi.verifyPhoneCode(session!.accessToken, {
        phone_number: phone!,
        code,
      }),
    onSuccess: () => {
      toast.success(dict.toasts.verified);
      router.push(`/${lang}/onboarding`);
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(errorCode, common.errors));
    },
  });

  function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    sendCodeMutation.mutate();
  }

  function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    verifyMutation.mutate();
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

      {step === "phone" ? (
        <form className="mt-8 space-y-4" onSubmit={handleSendCode}>
          <PhoneInput
            label={dict.phoneLabel}
            lang={lang}
            value={phone}
            onChange={setPhone}
            searchPlaceholder={common.countrySearchPlaceholder}
            noResultsLabel={common.noCountriesFound}
          />

          <Button type="submit" disabled={sendCodeMutation.isPending || !phone}>
            {sendCodeMutation.isPending ? common.loading : dict.sendCode}
          </Button>
        </form>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleVerify}>
          <p className="text-sm text-muted-foreground">
            {dict.codeSentTo} <span className="text-foreground">{phone}</span>
          </p>

          <div>
            <OtpInput label={dict.codeLabel} value={code} onChange={setCode} />
            <p className="mt-2 text-xs text-muted-foreground">
              <button
                type="button"
                disabled={sendCodeMutation.isPending}
                onClick={() => sendCodeMutation.mutate()}
                className="font-medium text-brand hover:text-brand-hover disabled:opacity-60"
              >
                {dict.resendCode}
              </button>
            </p>
          </div>

          <Button
            type="submit"
            disabled={verifyMutation.isPending || code.length < 6}
          >
            {verifyMutation.isPending ? common.loading : dict.verify}
          </Button>

          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full text-center text-sm font-medium text-brand hover:text-brand-hover"
          >
            {dict.changeNumber}
          </button>
        </form>
      )}
    </div>
  );
}
