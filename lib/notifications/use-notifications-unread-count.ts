"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications-client";
import { notificationsKey } from "@/lib/notifications/query-keys";
import { readNotificationCache, writeNotificationCache } from "@/lib/notifications/cache";

export function useNotificationsUnreadCount(lang: string): number {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const userId = session?.user?.id;
  const isAuthenticated = status === "authenticated" && !!accessToken;

  const { data, isPlaceholderData } = useQuery({
    queryKey: notificationsKey.unreadCount(),
    queryFn: async () => {
      const result = await notificationsApi.list(accessToken!, lang, {
        is_read: false,
        page_size: 1,
      });
      return result.pagination.total_items;
    },
    enabled: isAuthenticated,
    // Last-known count shows instantly (badge never pops in late); the real
    // count replaces it as soon as the request returns.
    placeholderData: () => readNotificationCache(userId)?.unread,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data != null && !isPlaceholderData) writeNotificationCache(userId, { unread: data });
  }, [data, isPlaceholderData, userId]);

  return data ?? 0;
}
