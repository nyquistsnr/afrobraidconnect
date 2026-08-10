"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertCircle, MessageCircle } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { Locale } from "@/lib/i18n";
import { chatApi } from "@/lib/api/chat-client";
import { chatThreadsKey } from "@/lib/chat/query-keys";
import { PaginationControl } from "@/components/ui/pagination-control";
import { ChatThreadListItem } from "@/components/chat/chat-thread-list-item";
import type { ChatInboxDict } from "@/components/chat/types";

const PAGE_SIZE = 20;

export function ChatInboxView({
  lang,
  dict,
}: {
  lang: Locale;
  dict: ChatInboxDict;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: chatThreadsKey.list(page),
    queryFn: () => chatApi.listThreads(accessToken!, lang, { page, page_size: PAGE_SIZE }),
    enabled: sessionStatus === "authenticated" && !!accessToken,
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{dict.pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.pageSubtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <AlertCircle className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">{dict.errorTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.errorSubtitle}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            {dict.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <MessageCircle className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">{dict.emptyTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.emptySubtitle}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            {items.map((thread) => (
              <ChatThreadListItem key={thread.id} thread={thread} lang={lang} dict={dict} />
            ))}
          </div>

          {data && (
            <PaginationControl pagination={data.pagination} onChangePage={setPage} dict={dict} />
          )}
        </div>
      )}
    </div>
  );
}
