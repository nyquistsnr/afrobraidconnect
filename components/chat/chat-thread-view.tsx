"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ChevronUp, Flag, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { Locale } from "@/lib/i18n";
import { chatApi } from "@/lib/api/chat-client";
import { usersApi } from "@/lib/api/users-client";
import { chatMessagesKey, chatThreadsKey } from "@/lib/chat/query-keys";
import type { ChatMessageResponse, PaginatedData } from "@/lib/api/types";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ReportModal } from "@/components/chat/report-modal";
import type { ChatReportDict, ChatThreadDict } from "@/components/chat/types";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const PAGE_SIZE = 20;
const NUDGE_DISMISSED_KEY = "chat_locale_nudge_dismissed";

export function ChatThreadView({
  threadId,
  lang,
  dict,
  reportDict,
  common,
}: {
  threadId: string;
  lang: Locale;
  dict: ChatThreadDict;
  reportDict: ChatReportDict;
  common: Dictionary["common"];
}) {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const currentUserId = session?.user?.id;
  const queryClient = useQueryClient();

  const [reportOpen, setReportOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const skipAutoScrollRef = useRef(false);

  useEffect(() => {
    // Reads localStorage, which isn't available during SSR — deferring to
    // after mount (rather than a lazy useState initializer) avoids a
    // hydration mismatch, matching the pattern in theme-toggle.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNudgeDismissed(localStorage.getItem(NUDGE_DISMISSED_KEY) === "1");
  }, []);

  function dismissNudge() {
    localStorage.setItem(NUDGE_DISMISSED_KEY, "1");
    setNudgeDismissed(true);
  }

  // POST .../read doubles as "open/foreground this thread" (per the API
  // doc's suggested integration) and, conveniently, is the only endpoint
  // that returns this thread's participant name/id for the header — there's
  // no standalone GET /chat/threads/{id}.
  const {
    data: threadMeta,
    isLoading: isThreadMetaLoading,
    isError: isThreadMetaError,
  } = useQuery({
    queryKey: ["chat-thread-meta", threadId],
    queryFn: () => chatApi.markRead(accessToken!, threadId),
    enabled: sessionStatus === "authenticated" && !!accessToken,
    staleTime: Infinity,
    retry: false,
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.getMe(accessToken!),
    enabled: sessionStatus === "authenticated" && !!accessToken,
  });

  const messagesQuery = useInfiniteQuery({
    queryKey: chatMessagesKey(threadId),
    queryFn: ({ pageParam }) =>
      chatApi.listMessages(accessToken!, threadId, {
        page: pageParam,
        page_size: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    enabled: sessionStatus === "authenticated" && !!accessToken,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => chatApi.sendMessage(accessToken!, threadId, body),
    onSuccess: (message) => {
      // The WS `chat_message` broadcast fires for the sender too (per the
      // API doc), and can race ahead of this awaited REST response — the
      // realtime provider may have already prepended this exact message by
      // the time we get here. Skip if it's already in the cache to avoid a
      // duplicate-key render.
      queryClient.setQueryData<InfiniteData<PaginatedData<ChatMessageResponse>>>(
        chatMessagesKey(threadId),
        (current) => {
          if (!current) return current;
          const firstPage = current.pages[0];
          if (!firstPage) return current;
          if (firstPage.items.some((m) => m.id === message.id)) return current;
          return {
            ...current,
            pages: [
              {
                items: [message, ...firstPage.items],
                pagination: {
                  ...firstPage.pagination,
                  total_items: firstPage.pagination.total_items + 1,
                },
              },
              ...current.pages.slice(1),
            ],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: chatThreadsKey.all() });
    },
  });

  // Pages are fetched newest-first (page 1 = most recent 20); flattening in
  // fetch order then reversing yields a correctly ordered oldest→newest feed
  // regardless of how many older pages have been loaded.
  const messages = useMemo(() => {
    const pages = messagesQuery.data?.pages ?? [];
    return pages.flatMap((page) => page.items).reverse();
  }, [messagesQuery.data]);

  useEffect(() => {
    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function handleLoadEarlier() {
    skipAutoScrollRef.current = true;
    messagesQuery.fetchNextPage();
  }

  const showNudge =
    !nudgeDismissed && profile !== undefined && !profile.chat_locale;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/${lang}/chat`}
            aria-label={dict.backToInbox}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate text-base font-semibold text-foreground">
              {isThreadMetaLoading ? "…" : (threadMeta?.other_participant_name ?? "")}
            </span>
            <span
              title={threadId}
              className="shrink-0 font-mono text-xs text-muted-foreground"
            >
              #{threadId.slice(-4)}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
        >
          <Flag className="size-3.5" />
          {dict.reportAction}
        </button>
      </div>

      {showNudge && (
        <div className="mx-4 mt-3 flex items-start gap-3 rounded-xl border border-brand/30 bg-brand/5 p-3 sm:mx-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{dict.languageNudgeTitle}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{dict.languageNudgeBody}</p>
            <Link
              href={`/${lang}/profile`}
              className="mt-1.5 inline-block text-xs font-semibold text-brand underline underline-offset-2"
            >
              {dict.languageNudgeCta}
            </Link>
          </div>
          <button
            type="button"
            onClick={dismissNudge}
            aria-label={dict.languageNudgeDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {isThreadMetaError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <AlertCircle className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">{dict.loadErrorTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.loadErrorSubtitle}</p>
        </div>
      ) : messagesQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : messagesQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
          <AlertCircle className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">{dict.loadErrorTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.loadErrorSubtitle}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-6">
          {messagesQuery.hasNextPage && (
            <button
              type="button"
              onClick={handleLoadEarlier}
              disabled={messagesQuery.isFetchingNextPage}
              className="mx-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-border/40 disabled:opacity-50"
            >
              {messagesQuery.isFetchingNextPage ? (
                <Loader className="size-3.5 animate-spin" />
              ) : (
                <ChevronUp className="size-3.5" />
              )}
              {dict.loadEarlier}
            </button>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUserId}
              lang={lang}
              viewerChatLocale={profile?.chat_locale ?? null}
              dict={dict}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <ChatComposer
        onSend={(body) => sendMutation.mutate(body)}
        isSending={sendMutation.isPending}
        dict={dict}
      />

      {accessToken && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          threadId={threadId}
          accessToken={accessToken}
          closeLabel={common.close}
          dict={reportDict}
          errorsDict={common.errors}
        />
      )}
    </div>
  );
}
