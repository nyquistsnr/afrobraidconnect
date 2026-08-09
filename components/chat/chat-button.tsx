"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { MessageCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { chatApi } from "@/lib/api/chat-client";
import { ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import type { Locale } from "@/lib/i18n";
import type { ChatButtonDict } from "@/components/chat/types";
import type { Dictionary } from "@/app/[lang]/dictionaries";

// The endpoint creates the thread on first call, so this is a real mutation
// (not a Link) — resolve the thread id, then navigate.
export function ChatButton({
  bookingId,
  lang,
  accessToken,
  dict,
  errorsDict,
}: {
  bookingId: string;
  lang: Locale;
  accessToken: string;
  dict: ChatButtonDict;
  errorsDict: Dictionary["common"]["errors"];
}) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => chatApi.getOrCreateThreadForBooking(accessToken, bookingId),
    onSuccess: (thread) => {
      router.push(`/${lang}/chat/${thread.id}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? getAuthErrorMessage(error.code, errorsDict)
          : dict.errorMessage
      );
    },
  });

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-input px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-border/40 disabled:opacity-60"
    >
      {mutation.isPending ? (
        <Loader className="size-4 animate-spin" />
      ) : (
        <MessageCircle className="size-4" />
      )}
      {dict.label}
    </button>
  );
}
