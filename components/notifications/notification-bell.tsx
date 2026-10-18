"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePendingNavigation } from "@/lib/navigation/use-pending-navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, Loader2, Volume2, VolumeX } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { notificationsApi } from "@/lib/api/notifications-client";
import { notificationsKey } from "@/lib/notifications/query-keys";
import { useNotificationsUnreadCount } from "@/lib/notifications/use-notifications-unread-count";
import { readNotificationCache, writeNotificationCache } from "@/lib/notifications/cache";
import { getNotificationTarget } from "@/lib/notifications/notification-link";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
} from "@/lib/notifications/notification-sound";
import { formatThreadTimestamp } from "@/lib/chat/format";
import { NotificationTypeIcon } from "@/components/notifications/notification-type-icon";
import type { NotificationResponse, PaginatedData } from "@/lib/api/types";
import type { NotificationBellDict } from "@/components/notifications/types";

const PANEL_SIZE = 8;

type Panel = PaginatedData<NotificationResponse>;

export function NotificationBell({
  lang,
  dict,
}: {
  lang: Locale;
  dict: NotificationBellDict;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const userId = session?.user?.id;
  const isAuthenticated = sessionStatus === "authenticated" && !!accessToken;
  const router = usePendingNavigation();
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
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const unreadCount = useNotificationsUnreadCount(lang);

  // Filled before the panel is ever opened, three ways, so it never sits
  // empty: (1) the last-seen list from this device shows on first paint as
  // placeholder data, (2) the fresh list loads in the background as soon as
  // the session is known — not when the bell is clicked — and
  // (3) RealtimeProvider invalidates it whenever a notification arrives.
  const {
    data: recent,
    isPending: recentPending,
    isPlaceholderData,
    isFetching,
  } = useQuery({
    queryKey: notificationsKey.panel(),
    queryFn: () => notificationsApi.list(accessToken!, lang, { page_size: PANEL_SIZE }),
    enabled: isAuthenticated,
    placeholderData: () => readNotificationCache(userId)?.panel,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (recent && !isPlaceholderData) writeNotificationCache(userId, { panel: recent });
  }, [recent, isPlaceholderData, userId]);

  // Opening shows what's cached immediately and quietly re-checks.
  useEffect(() => {
    if (open && isAuthenticated) {
      queryClient.invalidateQueries({ queryKey: notificationsKey.panel() });
      queryClient.invalidateQueries({ queryKey: notificationsKey.unreadCount() });
    }
  }, [open, isAuthenticated, queryClient]);

  // Optimistic read state: the dot/badge clear the moment you tap, instead
  // of after a round trip; rolled back if the request fails.
  async function applyOptimistic(markRead: (item: NotificationResponse) => boolean) {
    await queryClient.cancelQueries({ queryKey: notificationsKey.panel() });
    const previousPanel = queryClient.getQueryData<Panel>(notificationsKey.panel());
    const previousUnread = queryClient.getQueryData<number>(notificationsKey.unreadCount());
    let cleared = 0;
    if (previousPanel) {
      queryClient.setQueryData<Panel>(notificationsKey.panel(), {
        ...previousPanel,
        items: previousPanel.items.map((item) => {
          if (item.is_read || !markRead(item)) return item;
          cleared += 1;
          return { ...item, is_read: true, read_at: new Date().toISOString() };
        }),
      });
    }
    return { previousPanel, previousUnread, cleared };
  }

  function rollback(context?: { previousPanel?: Panel; previousUnread?: number }) {
    if (!context) return;
    queryClient.setQueryData(notificationsKey.panel(), context.previousPanel);
    queryClient.setQueryData(notificationsKey.unreadCount(), context.previousUnread);
  }

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(accessToken!, lang, id),
    onMutate: async (id: string) => {
      const context = await applyOptimistic((item) => item.id === id);
      queryClient.setQueryData<number>(notificationsKey.unreadCount(), (n) =>
        Math.max(0, (n ?? 0) - 1)
      );
      return context;
    },
    onError: (_error, _id, context) => rollback(context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsKey.all() }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(accessToken!, lang),
    onMutate: async () => {
      const context = await applyOptimistic(() => true);
      queryClient.setQueryData<number>(notificationsKey.unreadCount(), 0);
      return context;
    },
    onError: (_error, _vars, context) => rollback(context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsKey.all() }),
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
  // Only a true first load (nothing cached anywhere) shows skeletons.
  const showSkeleton = recentPending && !recent;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          hasUnread ? `${dict.bellAriaLabel} (${unreadCount})` : dict.bellAriaLabel
        }
        className={`relative flex size-11 items-center justify-center rounded-full border transition-colors md:size-10 md:border-transparent ${
          open
            ? "border-border bg-border/50 text-foreground"
            : "border-border bg-surface text-foreground shadow-sm hover:bg-border/40 md:bg-transparent md:text-muted-foreground md:shadow-none md:hover:text-foreground"
        }`}
      >
        <Bell className={`size-5 md:size-[18px] ${hasUnread ? "bell-ring" : ""}`} key={unreadCount} />
        {hasUnread && (
          <span className="badge-pop absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-bold text-brand-foreground ring-2 ring-background">
            {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Phones: dim the page behind the full-width panel. */}
          <div
            className="install-backdrop fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="search-panel-in fixed inset-x-3 top-[84px] z-50 flex max-h-[calc(100dvh-160px)] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl md:absolute md:inset-x-auto md:top-full md:right-0 md:mt-2 md:max-h-[min(560px,calc(100dvh-120px))] md:w-[380px] md:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                {dict.panelTitle}
                {hasUnread && (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                    {unreadCount}
                  </span>
                )}
                {isFetching && !showSkeleton && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden />
                )}
              </span>
              <div className="flex items-center gap-1">
                {hasUnread && (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/10"
                  >
                    <CheckCheck className="size-3.5" />
                    {dict.markAllRead}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-label={soundEnabled ? dict.muteSound : dict.unmuteSound}
                  aria-pressed={!soundEnabled}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
                >
                  {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
                </button>
              </div>
            </div>

            {showSkeleton ? (
              <ul className="py-1" aria-busy="true">
                {Array.from({ length: Math.min(Math.max(unreadCount, 3), 5) }, (_, i) => (
                  <li key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="skeleton-shimmer size-9 shrink-0 rounded-full bg-border/60" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5">
                      <span className="skeleton-shimmer h-3 w-3/5 rounded bg-border/60" />
                      <span className="skeleton-shimmer h-2.5 w-4/5 rounded bg-border/40" />
                      <span className="skeleton-shimmer h-2 w-1/4 rounded bg-border/40" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-border/40">
                  <BellOff className="size-5 text-icon-muted" />
                </span>
                <p className="text-sm font-semibold text-foreground">{dict.emptyTitle}</p>
                <p className="max-w-[240px] text-xs text-muted-foreground">{dict.emptySubtitle}</p>
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {items.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleRowClick(notification)}
                      className={`relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-border/40 active:bg-border/60 ${
                        notification.is_read ? "" : "bg-brand/[0.04]"
                      }`}
                    >
                      <NotificationTypeIcon type={notification.type} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`line-clamp-1 text-sm ${
                              notification.is_read
                                ? "font-medium text-foreground/90"
                                : "font-semibold text-foreground"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">
                            {formatThreadTimestamp(notification.created_at, lang)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {notification.body}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href={`/${lang}/notifications`}
              onClick={() => setOpen(false)}
              className="block shrink-0 border-t border-border px-4 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
            >
              {dict.viewAll}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
