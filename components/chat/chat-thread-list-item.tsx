"use client";

import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ChatThreadResponse } from "@/lib/api/types";
import { formatTemplate } from "@/lib/format-template";
import { formatThreadTimestamp } from "@/lib/chat/format";
import type { ChatInboxDict } from "@/components/chat/types";

export function ChatThreadListItem({
  thread,
  lang,
  dict,
}: {
  thread: ChatThreadResponse;
  lang: Locale;
  dict: ChatInboxDict;
}) {
  const hasUnread = thread.unread_count > 0;
  const preview = thread.last_message_flagged
    ? dict.flaggedPreview
    : (thread.last_message_preview ?? dict.noMessagesYet);

  return (
    <Link
      href={`/${lang}/chat/${thread.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:bg-border/20"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-border text-muted-foreground">
        <CircleUserRound className="size-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span
              className={`truncate text-sm ${hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"}`}
            >
              {thread.other_participant_name}
            </span>
            <span
              title={thread.id}
              className="shrink-0 font-mono text-[11px] text-muted-foreground"
            >
              #{thread.id.slice(-4)}
            </span>
          </span>
          {thread.last_message_at && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatThreadTimestamp(thread.last_message_at, lang)}
            </span>
          )}
        </div>
        <p
          className={`mt-0.5 truncate text-sm ${hasUnread ? "text-foreground" : "text-muted-foreground"}`}
        >
          {preview}
        </p>
      </div>

      {hasUnread && (
        <span
          aria-label={formatTemplate(dict.unreadAria, { count: thread.unread_count })}
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground"
        >
          {thread.unread_count > 9 ? "9+" : thread.unread_count}
        </span>
      )}
    </Link>
  );
}
