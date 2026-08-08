"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useChatUnreadTotal } from "@/lib/chat/use-chat-unread-total";

export function ChatNavIcon({ lang, ariaLabel }: { lang: Locale; ariaLabel: string }) {
  const unreadTotal = useChatUnreadTotal();

  return (
    <Link
      href={`/${lang}/chat`}
      aria-label={ariaLabel}
      className="relative flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-border/40 hover:text-foreground"
    >
      <MessageCircle className="size-4" />
      {unreadTotal > 0 && (
        <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
          {unreadTotal > 9 ? "9+" : unreadTotal}
        </span>
      )}
    </Link>
  );
}
