"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { onboardingStepPath } from "@/lib/onboarding";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { size: "large" | "medium" | "small"; width: number }
          ) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  lang,
  label,
  successMessage,
  errorsDict,
  callbackUrl,
}: {
  lang: Locale;
  label: string;
  successMessage: string;
  errorsDict: Dictionary["common"]["errors"];
  callbackUrl?: string | null;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const googleSignInMutation = useMutation({
    mutationFn: async (providerToken: string) => {
      const result = await signIn("google", { providerToken, redirect: false });
      if (result?.error) {
        throw new Error(result.code ?? result.error);
      }
    },
    onSuccess: async () => {
      toast.success(successMessage);
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
      toast.error(getAuthErrorMessage(error.message, errorsDict));
    },
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set — Google sign-in is disabled."
      );
      return;
    }

    // The GSI script (loaded via next/script in the root layout) may not
    // have finished executing yet when this effect first runs — poll
    // rather than assume it's ready.
    let cancelled = false;

    function renderWhenReady() {
      if (cancelled) return;
      const container = containerRef.current;
      const wrapper = wrapperRef.current;
      const google = window.google;

      if (!google || !container || !wrapper) {
        setTimeout(renderWhenReady, 100);
        return;
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID as string,
        // The ID token is short-lived and single-use for verification —
        // it's handed straight to authorize(), never cached or replayed.
        callback: (response) => googleSignInMutation.mutate(response.credential),
      });

      // Google's own rendered button is the only supported way to get an
      // ID token (rather than an access token) from a click — but its
      // built-in themes always keep a white backing chip behind the logo
      // even in dark mode, and its `text` option only offers a handful of
      // fixed Google-picked strings that don't follow this app's language
      // switcher. So it's rendered fully transparent, stretched exactly
      // over our own styled + translated button below, and just catches
      // the click; all the visible pixels are ours.
      google.accounts.id.renderButton(container, {
        size: "large",
        width: wrapper.offsetWidth || 320,
      });
    }

    renderWhenReady();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div ref={wrapperRef} className="relative h-10 w-full">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none flex h-10 w-full items-center justify-center gap-3 border border-border bg-input text-sm font-semibold text-foreground"
      >
        <GoogleIcon className="size-5 shrink-0" />
        {label}
      </button>

      {/* Google's real, functional button — invisible but still the
          element that actually receives the click and keyboard focus. */}
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden opacity-0"
      />
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.89c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3c-1.08.73-2.46 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.26v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.19 7.19 0 0 1 0-4.58V6.6H1.26a12 12 0 0 0 0 10.8l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.6l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}
