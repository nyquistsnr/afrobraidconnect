"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  Banknote,
  Check,
  ExternalLink,
  EyeOff,
  Flag,
  MailWarning,
  MoreHorizontal,
  ShieldAlert,
  X,
} from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { LucideIcon } from "lucide-react";
import { chatApi } from "@/lib/api/chat-client";
import { ApiError } from "@/lib/api/auth-client";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import type { ChatReportReason } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { ChatReportDict } from "@/components/chat/types";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const REASONS: ChatReportReason[] = [
  "HARASSMENT",
  "INAPPROPRIATE_CONTENT",
  "SPAM",
  "SCAM_OR_FRAUD",
  "OFF_PLATFORM_SOLICITATION",
  "OTHER",
];

const REASON_ICONS: Record<ChatReportReason, LucideIcon> = {
  HARASSMENT: ShieldAlert,
  INAPPROPRIATE_CONTENT: EyeOff,
  SPAM: MailWarning,
  SCAM_OR_FRAUD: Banknote,
  OFF_PLATFORM_SOLICITATION: ExternalLink,
  OTHER: MoreHorizontal,
};

const DETAILS_MAX_LENGTH = 1000;

export function ReportModal({
  open,
  onClose,
  threadId,
  lang,
  accessToken,
  closeLabel,
  dict,
  errorsDict,
}: {
  open: boolean;
  onClose: () => void;
  threadId: string;
  lang: Locale;
  accessToken: string;
  closeLabel: string;
  dict: ChatReportDict;
  errorsDict: Dictionary["common"]["errors"];
}) {
  const [reason, setReason] = useState<ChatReportReason | "">("");
  const [details, setDetails] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      chatApi.report(accessToken, lang, threadId, {
        reason: reason as ChatReportReason,
        details: details.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(dict.successMessage);
      setReason("");
      setDetails("");
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? getAuthErrorMessage(error.code, errorsDict)
          : dict.errorMessage
      );
    },
  });

  function handleClose() {
    if (mutation.isPending) return;
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="chat-report-title">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <Flag className="size-5" />
          </div>
          <div>
            <h2
              id="chat-report-title"
              className="text-lg font-semibold text-foreground"
            >
              {dict.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {dict.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={closeLabel}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <div>
          <span className="mb-2 block text-sm font-medium text-foreground">
            {dict.reasonLabel}
          </span>
          <div role="radiogroup" aria-label={dict.reasonLabel} className="flex flex-col gap-2">
            {REASONS.map((value) => {
              const Icon = REASON_ICONS[value];
              const selected = reason === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setReason(value)}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    selected
                      ? "border-brand bg-brand/5"
                      : "border-border hover:bg-border/30"
                  }`}
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      selected
                        ? "bg-brand text-brand-foreground"
                        : "bg-border/50 text-icon-muted"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span
                    className={`flex-1 text-sm font-medium ${
                      selected ? "text-brand" : "text-foreground"
                    }`}
                  >
                    {dict.reasons[value]}
                  </span>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      selected
                        ? "border-brand bg-brand"
                        : "border-border bg-transparent"
                    }`}
                  >
                    {selected && (
                      <Check className="size-3 text-brand-foreground" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label
            htmlFor="report-details"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {dict.detailsLabel}
          </label>
          <div className="relative">
            <textarea
              id="report-details"
              value={details}
              onChange={(event) =>
                setDetails(event.target.value.slice(0, DETAILS_MAX_LENGTH))
              }
              placeholder={dict.detailsPlaceholder}
              rows={3}
              maxLength={DETAILS_MAX_LENGTH}
              className="w-full resize-none rounded-xl border border-border bg-input px-4 pt-3 pb-6 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand"
            />
            <span className="pointer-events-none absolute bottom-2.5 right-3.5 text-xs text-muted-foreground">
              {details.length}/{DETAILS_MAX_LENGTH}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{dict.confidentialNote}</p>

        <div className="mt-1 flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={handleClose} className="w-auto">
            {dict.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!reason || mutation.isPending}
            className="w-auto"
          >
            {mutation.isPending && <Loader className="mr-2 size-4 animate-spin" />}
            {mutation.isPending ? dict.submitting : dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
