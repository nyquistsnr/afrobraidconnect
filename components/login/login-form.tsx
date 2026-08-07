"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { onboardingStepPath } from "@/lib/onboarding";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function LoginForm({
  dict,
  common,
  lang,
  callbackUrl,
}: {
  dict: Dictionary["login"] & { rememberMe?: string };
  common: Dictionary["common"];
  lang: Locale;
  callbackUrl?: string | null;
}) {
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string; rememberMe: boolean }) => {
      const result = await signIn("credentials", {
        ...credentials,
        rememberMe: String(credentials.rememberMe),
        redirect: false,
      });

      // signIn() never rejects for auth failures — it resolves with an
      // error/code pair instead, so we translate that into a thrown error
      // to let TanStack Query's onError path handle it uniformly.
      if (result?.error) {
        throw new Error(result.code ?? result.error);
      }
    },
    onSuccess: async () => {
      toast.success(common.toasts.loginSuccess);
      // A validated callbackUrl (wherever the visitor was before an auth
      // guard sent them here) always wins over the default destination.
      if (callbackUrl) {
        router.push(callbackUrl);
        return;
      }
      const session = await getSession();
      const step = session?.braider?.onboarding.current_step;
      router.push(
        step && step !== "COMPLETED"
          ? onboardingStepPath(lang, step)
          : `/${lang}/dashboard`
      );
    },
    onError: (error) => {
      toast.error(getAuthErrorMessage(error.message, common.errors));
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    loginMutation.mutate({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      rememberMe: formData.get("remember_me") === "on",
    });
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
          required
        />

        <PasswordInput
          label={dict.passwordLabel}
          name="password"
          autoComplete="current-password"
          placeholder={dict.passwordPlaceholder}
          required
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox name="remember_me" />
            <span className="text-sm font-medium text-foreground select-none">
              {dict.rememberMe || "Remember me"}
            </span>
          </label>
          <Link
            href={`/${lang}/forgot-password`}
            className="text-sm font-medium text-brand hover:text-brand-hover"
          >
            {dict.forgotPassword}
          </Link>
        </div>

        <Button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? common.loading : dict.signIn}
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
        label={dict.signInWithGoogle}
        successMessage={common.toasts.loginSuccess}
        errorsDict={common.errors}
        callbackUrl={callbackUrl}
      />

      <div className="mt-8 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          {dict.noAccount}{" "}
          <Link
            href={`/${lang}/signup`}
            className="font-medium text-brand hover:text-brand-hover"
          >
            {dict.signUpProfessional}
          </Link>
        </p>
        <p>
          {dict.notVerified}{" "}
          <Link
            href={`/${lang}/verify-email`}
            className="font-medium text-brand hover:text-brand-hover"
          >
            {dict.revalidate}
          </Link>
        </p>
      </div>
    </div>
  );
}
