"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications-client";
import { notificationsKey } from "@/lib/notifications/query-keys";

export function useNotificationsUnreadCount(lang: string): number {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const isAuthenticated = status === "authenticated" && !!accessToken;

  const { data } = useQuery({
    queryKey: notificationsKey.unreadCount(),
    queryFn: async () => {
      const result = await notificationsApi.list(accessToken!, lang, {
        is_read: false,
        page_size: 1,
      });
      return result.pagination.total_items;
    },
    enabled: isAuthenticated,
  });

  return data ?? 0;
}
