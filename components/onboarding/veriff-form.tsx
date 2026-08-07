"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { RefreshCw, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { VeriffStatusResponse } from "@/lib/api/types";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { Button } from "@/components/ui/button";

const FAILED_STATUSES = new Set(["DECLINED", "EXPIRED", "ABANDONED"]);
const PENDING_STATUSES = new Set([
  "CREATED",
  "SUBMITTED",
  "REVIEW",
  "RESUBMISSION_REQUESTED",
]);

export function VeriffForm({
  dict,
  common,
  lang,
  initialStatus,
}: {
  dict: Dictionary["onboarding"]["veriff"];
  common: Dictionary["common"];
  lang: Locale;
  initialStatus: VeriffStatusResponse;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  const startMutation = useMutation({
    mutationFn: () => onboardingApi.startVeriffSession(session!.accessToken),
    onSuccess: (data) => {
      window.location.href = data.verification_url;
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => onboardingApi.refreshVeriffStatus(session!.accessToken),
    onSuccess: (data) => {
      setStatus(data);
      toast.success(dict.toasts.refreshed);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  function handleContinue() {
    router.push(`/${lang}/onboarding`);
  }

  if (!status.has_session) {
    return (
      <div className="w-full">
        <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            {dict.start.description}
          </p>
          <Button
            type="button"
            disabled={startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            {startMutation.isPending ? common.loading : dict.start.button}
          </Button>
        </div>
      </div>
    );
  }

  if (status.status === "APPROVED") {
    return (
      <div className="w-full">
        <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3 border border-border bg-input px-4 py-3">
            <ShieldCheck className="size-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {dict.approved.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {dict.approved.description}
              </p>
            </div>
          </div>
          <Button type="button" onClick={handleContinue}>
            {dict.approved.continue}
          </Button>
        </div>
      </div>
    );
  }

  if (status.status && FAILED_STATUSES.has(status.status)) {
    return (
      <div className="w-full">
        <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

        <div className="mt-8 space-y-4">
          <div className="flex items-start gap-3 border border-border bg-input px-4 py-3">
            <ShieldAlert className="size-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {dict.failed.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {dict.failed.description}
              </p>
              {status.reason && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {dict.reasonLabel}: {status.reason}
                </p>
              )}
            </div>
          </div>
          <Button
            type="button"
            disabled={startMutation.isPending}
            onClick={() => startMutation.mutate()}
          >
            {startMutation.isPending ? common.loading : dict.failed.tryAgain}
          </Button>
        </div>
      </div>
    );
  }

  // has_session with a pending status (CREATED, SUBMITTED, REVIEW,
  // RESUBMISSION_REQUESTED) — Veriff's decision is async, so this is a
  // manual "check again" rather than an auto-poll.
  const isPending =
    !status.status || PENDING_STATUSES.has(status.status);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

      <div className="mt-8 space-y-4">
        <div className="flex items-start gap-3 border border-border bg-input px-4 py-3">
          <ShieldQuestion className="size-5 shrink-0 text-icon-muted" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {dict.pending.title}
            </p>
            <p className="text-sm text-muted-foreground">
              {dict.pending.description}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dict.statusLabel}: {status.status_label}
            </p>
          </div>
        </div>

        {isPending && status.verification_url && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = status.verification_url!;
            }}
          >
            {dict.pending.resume}
          </Button>
        )}

        <Button
          type="button"
          variant={isPending && status.verification_url ? "outline" : "primary"}
          disabled={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
        >
          <RefreshCw className="size-4" />
          {refreshMutation.isPending ? common.loading : dict.pending.refresh}
        </Button>
      </div>
    </div>
  );
}
