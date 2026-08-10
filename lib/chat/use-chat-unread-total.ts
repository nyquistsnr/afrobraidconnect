"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/lib/api/chat-client";
import { chatThreadsKey } from "@/lib/chat/query-keys";
import type { Locale } from "@/lib/i18n";

// No dedicated unread-aggregate endpoint is documented, so this sums
// unread_count across the first page of threads — plenty for the header
// badge given how few concurrent conversations a customer realistically has.
export function useChatUnreadTotal(lang: Locale): number {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const isAuthenticated = status === "authenticated" && !!accessToken;

  const { data } = useQuery({
    queryKey: chatThreadsKey.unreadTotal(),
    queryFn: () => chatApi.listThreads(accessToken!, lang, { page_size: 50 }),
    enabled: isAuthenticated,
  });

  if (!data) return 0;
  return data.items.reduce((sum, thread) => sum + thread.unread_count, 0);
}
