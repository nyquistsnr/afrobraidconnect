"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Mail, User } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { SignupEmailRequest } from "@/lib/api/types";
import { authApi, ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignupForm({
  dict,
  common,
  lang,
  callbackUrl,
}: {
  dict: Dictionary["signup"];
  common: Dictionary["common"];
  lang: Locale;
  callbackUrl?: string | null;
}) {
  const [phone, setPhone] = useState<string | undefined>();
  const router = useRouter();

  const signupMutation = useMutation({
    mutationFn: (body: SignupEmailRequest) => authApi.signup(body, lang),
    onSuccess: ({ email }) => {
      toast.success(common.toasts.signupSuccess);
      const url = new URL(`/${lang}/verify-email`, window.location.origin);
      url.searchParams.set("email", email);
      if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
      router.push(url.toString().replace(window.location.origin, ""));
    },
    onError: (error) => {
      const errorCode = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(errorCode, common.errors));
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const lastName = String(formData.get("lastName") ?? "").trim();

    signupMutation.mutate({
      first_name: String(formData.get("firstName") ?? ""),
      last_name: lastName || undefined,
      email: String(formData.get("email") ?? ""),
      phone_number: phone,
      password: String(formData.get("password") ?? ""),
      user_type: "CUSTOMER",
    });
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={dict.firstNameLabel}
            name="firstName"
            icon={User}
            autoComplete="given-name"
            placeholder={dict.firstNamePlaceholder}
            required
          />
          <Input
            label={dict.lastNameLabel}
            name="lastName"
            icon={User}
            autoComplete="family-name"
            placeholder={dict.lastNamePlaceholder}
          />
        </div>

        <Input
          label={dict.emailLabel}
          type="email"
          name="email"
          icon={Mail}
          autoComplete="email"
          placeholder={dict.emailPlaceholder}
          required
        />

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-medium text-foreground">
              {dict.phoneLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              {dict.phoneOptional}
            </span>
          </div>
          <PhoneInput
            label={dict.phoneLabel}
            lang={lang}
            value={phone}
            onChange={setPhone}
            searchPlaceholder={common.countrySearchPlaceholder}
            noResultsLabel={common.noCountriesFound}
          />
        </div>

        <PasswordInput
          label={dict.passwordLabel}
          name="password"
          autoComplete="new-password"
          placeholder={dict.passwordPlaceholder}
          minLength={8}
          required
        />

        <Button type="submit" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? common.loading : dict.submit}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">
          {dict.or}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton
        lang={lang}
        label={dict.signUpWithGoogle}
        successMessage={common.toasts.loginSuccess}
        errorsDict={common.errors}
        callbackUrl={callbackUrl}
      />

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {dict.alreadyHaveAccount}{" "}
        <Link
          href={`/${lang}/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
          className="font-medium text-brand hover:text-brand-hover"
        >
          {dict.signIn}
        </Link>
      </p>
    </div>
  );
}
