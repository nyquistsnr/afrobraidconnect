"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Volume2, VolumeX } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { notificationsApi } from "@/lib/api/notifications-client";
import { notificationsKey } from "@/lib/notifications/query-keys";
import { useNotificationsUnreadCount } from "@/lib/notifications/use-notifications-unread-count";
import { getNotificationTarget } from "@/lib/notifications/notification-link";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/notifications/notification-sound";
import { formatThreadTimestamp } from "@/lib/chat/format";
import { NotificationTypeIcon } from "@/components/notifications/notification-type-icon";
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
  // Lazy-init from localStorage is safe here (no SSR hydration mismatch
  // risk) because this button only ever renders once `open` is true, which
  // can't happen until after the user has clicked the bell client-side.
  const [soundEnabled, setSoundEnabled] = useState(() => isNotificationSoundEnabled());

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setNotificationSoundEnabled(next);
  }

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

  const unreadCount = useNotificationsUnreadCount(lang);

  const { data: recent } = useQuery({
    queryKey: notificationsKey.panel(),
    queryFn: () => notificationsApi.list(accessToken!, lang, { page_size: PANEL_SIZE }),
    enabled: isAuthenticated && open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(accessToken!, lang, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey.all() });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(accessToken!, lang),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey.all() });
    },
  });

  function handleRowClick(notification: NotificationResponse) {
    if (!notification.is_read) markReadMutation.mutate(notification.id);
    setOpen(false);
    const target = getNotificationTarget(notification, lang);
    if (target) router.push(target);
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
            <div className="flex items-center gap-3">
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
              <button
                type="button"
                onClick={toggleSound}
                aria-label={soundEnabled ? dict.muteSound : dict.unmuteSound}
                aria-pressed={!soundEnabled}
                className="rounded-full p-1 text-muted-foreground hover:bg-border/40 hover:text-foreground"
              >
                {soundEnabled ? (
                  <Volume2 className="size-4" />
                ) : (
                  <VolumeX className="size-4" />
                )}
              </button>
            </div>
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
                    className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-border/40"
                  >
                    <NotificationTypeIcon type={notification.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={`truncate text-sm ${notification.is_read ? "font-medium text-foreground" : "font-semibold text-foreground"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                        )}
                      </div>
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
