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
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm({
  dict,
  common,
  lang,
}: {
  dict: Dictionary["forgotPassword"];
  common: Dictionary["common"];
  lang: Locale;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast.success(common.toasts.forgotPasswordSuccess);
      router.push(`/${lang}/reset-password?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(errorCode, common.errors));
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    forgotPasswordMutation.mutate({ email });
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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

        <Button type="submit" disabled={forgotPasswordMutation.isPending}>
          {forgotPasswordMutation.isPending ? common.loading : dict.submit}
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
