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
import { PasswordInput } from "@/components/ui/password-input";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({
  dict,
  common,
  lang,
  defaultEmail,
}: {
  dict: Dictionary["resetPassword"];
  common: Dictionary["common"];
  lang: Locale;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const router = useRouter();

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success(common.toasts.resetPasswordSuccess);
      router.push(`/${lang}/login`);
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(errorCode, common.errors));
    },
  });

  const resendMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => toast.success(common.toasts.resendSuccess),
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(errorCode, common.errors));
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    resetPasswordMutation.mutate({ email, code, new_password: newPassword });
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

        <PasswordInput
          label={dict.newPasswordLabel}
          name="new-password"
          autoComplete="new-password"
          placeholder={dict.newPasswordPlaceholder}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={8}
          required
        />

        <Button
          type="submit"
          disabled={resetPasswordMutation.isPending || code.length < 6}
        >
          {resetPasswordMutation.isPending ? common.loading : dict.submit}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link
          href={`/${lang}/login`}
          className="font-medium text-brand hover:text-brand-hover"
        >
          {common.backToLogin}
        </Link>
      </p>
    </div>
  );
}
