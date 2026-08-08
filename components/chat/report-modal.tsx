"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Loader2, X } from "lucide-react";
import { chatApi } from "@/lib/api/chat-client";
import { ApiError } from "@/lib/api/auth-client";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import type { ChatReportReason } from "@/lib/api/types";
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

export function ReportModal({
  open,
  onClose,
  threadId,
  accessToken,
  closeLabel,
  dict,
  errorsDict,
}: {
  open: boolean;
  onClose: () => void;
  threadId: string;
  accessToken: string;
  closeLabel: string;
  dict: ChatReportDict;
  errorsDict: Dictionary["common"]["errors"];
}) {
  const [reason, setReason] = useState<ChatReportReason | "">("");
  const [details, setDetails] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      chatApi.report(accessToken, threadId, {
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
      <div className="flex items-center justify-between">
        <h2 id="chat-report-title" className="text-lg font-semibold text-foreground">
          {dict.title}
        </h2>
        <button
          type="button"
          onClick={handleClose}
          aria-label={closeLabel}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <Select
          label={dict.reasonLabel}
          showLabel
          value={reason}
          onChange={setReason}
          options={REASONS.map((value) => ({
            value,
            label: dict.reasons[value],
          }))}
        />

        <div>
          <label
            htmlFor="report-details"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {dict.detailsLabel}
          </label>
          <textarea
            id="report-details"
            value={details}
            onChange={(event) => setDetails(event.target.value.slice(0, 1000))}
            placeholder={dict.detailsPlaceholder}
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand"
          />
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose} className="w-auto">
            {dict.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!reason || mutation.isPending}
            className="w-auto"
          >
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {mutation.isPending ? dict.submitting : dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
