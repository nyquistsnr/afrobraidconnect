"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { buildRealtimeSocketUrl } from "@/lib/api/ws-url";
import { chatThreadsKey, chatMessagesKey } from "@/lib/chat/query-keys";
import { notificationsKey } from "@/lib/notifications/query-keys";
import type {
  ChatMessageResponse,
  PaginatedData,
  RealtimeEvent,
} from "@/lib/api/types";

const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;

// One WebSocket per session, opened app-wide (not per-screen) right after
// login and reconnected on token refresh — mirrors the API doc's suggested
// integration order. Every event just patches/invalidates the React Query
// cache; there's no separate realtime store.
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  // Stable for the lifetime of the app (QueryProvider creates it once via a
  // useState lazy initializer), so closing over it directly here is safe —
  // it's included in the deps array below for correctness, not because it
  // ever actually changes and reconnects the socket.
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const url = buildRealtimeSocketUrl(accessToken);
    if (!url) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let closedByClient = false;

    function handleEvent(payload: RealtimeEvent) {
      const qc = queryClient;

      switch (payload.type) {
        case "chat_message": {
          const key = chatMessagesKey(payload.thread_id);
          qc.setQueryData<InfiniteData<PaginatedData<ChatMessageResponse>>>(
            key,
            (current) => {
              if (!current) return current;
              const firstPage = current.pages[0];
              if (!firstPage) return current;
              if (firstPage.items.some((m) => m.id === payload.message.id)) {
                return current;
              }
              const patchedFirstPage: PaginatedData<ChatMessageResponse> = {
                items: [payload.message, ...firstPage.items],
                pagination: {
                  ...firstPage.pagination,
                  total_items: firstPage.pagination.total_items + 1,
                },
              };
              return {
                ...current,
                pages: [patchedFirstPage, ...current.pages.slice(1)],
              };
            }
          );
          qc.invalidateQueries({ queryKey: chatThreadsKey.all() });
          break;
        }
        case "chat_message_translated": {
          const key = chatMessagesKey(payload.thread_id);
          qc.setQueryData<InfiniteData<PaginatedData<ChatMessageResponse>>>(
            key,
            (current) => {
              if (!current) return current;
              return {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  items: page.items.map((message) =>
                    message.id === payload.message_id
                      ? {
                          ...message,
                          translated_body: payload.translated_body,
                          translated_locale: payload.translated_locale,
                        }
                      : message
                  ),
                })),
              };
            }
          );
          break;
        }
        case "notification": {
          qc.invalidateQueries({ queryKey: notificationsKey.all() });
          break;
        }
      }
    }

    function scheduleReconnect() {
      if (closedByClient) return;
      const delay = Math.min(
        BASE_BACKOFF_MS * 2 ** attempt,
        MAX_BACKOFF_MS
      );
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    }

    function connect() {
      socket = new WebSocket(url!);

      socket.onopen = () => {
        attempt = 0;
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RealtimeEvent;
          handleEvent(payload);
        } catch {
          // Ignore malformed/non-JSON frames — this is a push-only nudge
          // channel, not a delivery guarantee.
        }
      };

      socket.onclose = (event) => {
        // 4401 = auth failure. Retrying with the same dead token would just
        // loop — wait for accessToken to change (token refresh) instead.
        if (event.code === 4401) return;
        scheduleReconnect();
      };

      socket.onerror = () => {
        socket?.close();
      };
    }

    connect();

    return () => {
      closedByClient = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [accessToken, queryClient]);

  return <>{children}</>;
}
