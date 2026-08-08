"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { authApi, ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";

export function VerifyEmailForm({
  dict,
  common,
  lang,
  defaultEmail,
  callbackUrl,
}: {
  dict: Dictionary["verifyEmail"];
  common: Dictionary["common"];
  lang: Locale;
  defaultEmail: string;
  callbackUrl?: string | null;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const router = useRouter();

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      toast.success(common.toasts.verifyEmailSuccess);
      const url = new URL(`/${lang}/login`, window.location.origin);
      if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
      router.push(url.toString().replace(window.location.origin, ""));
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(errorCode, common.errors));
    },
  });

  const resendMutation = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => toast.success(common.toasts.resendSuccess),
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(errorCode, common.errors));
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    verifyMutation.mutate({ email, code });
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Input
          label={dict.emailLabel}
          type="email"
          name="email"
          icon={Mail}
          autoComplete="email"
          placeholder={dict.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <div>
          <OtpInput label={dict.codeLabel} value={code} onChange={setCode} />
          <p className="mt-2 text-xs text-muted-foreground">
            {dict.codeHelp}{" "}
            <button
              type="button"
              disabled={resendMutation.isPending}
              onClick={() => resendMutation.mutate({ email })}
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
          {verifyMutation.isPending ? common.loading : dict.submit}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          href={`/${lang}/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-medium text-brand hover:text-brand-hover"
        >
          {common.backToLogin}
        </Link>
      </p>
    </div>
  );
}
