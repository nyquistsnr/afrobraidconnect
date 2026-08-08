"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { notificationsApi } from "@/lib/api/notifications-client";
import { notificationsKey } from "@/lib/notifications/query-keys";
import { formatThreadTimestamp } from "@/lib/chat/format";
import type { NotificationResponse } from "@/lib/api/types";
import type { NotificationBellDict } from "@/components/notifications/types";

const PANEL_SIZE = 8;

export function NotificationBell({
  lang,
  dict,
}: {
  lang: Locale;
  dict: NotificationBellDict;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const isAuthenticated = sessionStatus === "authenticated" && !!accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const { data: unreadCount } = useQuery({
    queryKey: notificationsKey.unreadCount(),
    queryFn: async () => {
      const result = await notificationsApi.list(accessToken!, {
        is_read: false,
        page_size: 1,
      });
      return result.pagination.total_items;
    },
    enabled: isAuthenticated,
  });

  const { data: recent } = useQuery({
    queryKey: notificationsKey.panel(),
    queryFn: () => notificationsApi.list(accessToken!, { page_size: PANEL_SIZE }),
    enabled: isAuthenticated && open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(accessToken!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey.all() });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey.all() });
    },
  });

  function handleRowClick(notification: NotificationResponse) {
    if (!notification.is_read) markReadMutation.mutate(notification.id);
    setOpen(false);
    if (notification.related_type === "chat_thread" && notification.related_id) {
      router.push(`/${lang}/chat/${notification.related_id}`);
    }
  }

  if (!isAuthenticated) return null;

  const items = recent?.items ?? [];
  const hasUnread = (unreadCount ?? 0) > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={dict.bellAriaLabel}
        className="relative flex items-center justify-center rounded-full p-2 text-muted-foreground hover:bg-border/40 hover:text-foreground"
      >
        <Bell className="size-4" />
        {hasUnread && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
            {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">{dict.panelTitle}</span>
            {hasUnread && (
              <button
                type="button"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
              >
                {dict.markAllRead}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-foreground">{dict.emptyTitle}</p>
              <p className="text-xs text-muted-foreground">{dict.emptySubtitle}</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleRowClick(notification)}
                    className="flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-border/40"
                  >
                    {!notification.is_read && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                    )}
                    <div className={`min-w-0 flex-1 ${notification.is_read ? "pl-4" : ""}`}>
                      <p
                        className={`truncate text-sm ${notification.is_read ? "font-medium text-foreground" : "font-semibold text-foreground"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{notification.body}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatThreadTimestamp(notification.created_at, lang)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/${lang}/notifications`}
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-foreground hover:bg-border/40"
          >
            {dict.viewAll}
          </Link>
        </div>
      )}
    </div>
  );
}
