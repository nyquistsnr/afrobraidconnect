"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ChatMessageResponse } from "@/lib/api/types";
import { formatTemplate } from "@/lib/format-template";
import { formatMessageTime } from "@/lib/chat/format";
import type { ChatThreadDict } from "@/components/chat/types";

export function MessageBubble({
  message,
  isOwn,
  lang,
  viewerChatLocale,
  dict,
}: {
  message: ChatMessageResponse;
  isOwn: boolean;
  lang: Locale;
  viewerChatLocale: string | null;
  dict: ChatThreadDict;
}) {
  const targetLocale = viewerChatLocale || lang;
  const canShowTranslation =
    !!message.translated_body &&
    !!message.translated_locale &&
    message.translated_locale === targetLocale &&
    message.body_locale !== targetLocale;
  const [showOriginal, setShowOriginal] = useState(true);

  const time = formatMessageTime(message.created_at, lang);

  if (message.status === "FLAGGED") {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="flex max-w-[80%] items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{message.violation_notice ?? dict.flaggedFallback}</span>
        </div>
      </div>
    );
  }

  const displayBody =
    !showOriginal && canShowTranslation ? message.translated_body : message.body;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[80%] flex-col gap-1">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
            isOwn
              ? "rounded-br-sm bg-brand text-brand-foreground"
              : "rounded-bl-sm bg-border/40 text-foreground"
          }`}
        >
          {displayBody}
        </div>
        <div
          className={`flex items-center gap-2 px-1 text-[11px] text-muted-foreground ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <span>{time}</span>
          {canShowTranslation && (
            <button
              type="button"
              onClick={() => setShowOriginal((v) => !v)}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {showOriginal
                ? dict.seeTranslation
                : `${formatTemplate(dict.translatedFromLabel, {
                    locale: (message.body_locale ?? "").toUpperCase(),
                  })} · ${dict.seeOriginal}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
