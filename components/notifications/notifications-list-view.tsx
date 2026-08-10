"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bell, Trash2, X } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { Locale } from "@/lib/i18n";
import { notificationsApi } from "@/lib/api/notifications-client";
import { notificationsKey } from "@/lib/notifications/query-keys";
import { getNotificationTarget } from "@/lib/notifications/notification-link";
import { formatThreadTimestamp } from "@/lib/chat/format";
import { PaginationControl } from "@/components/ui/pagination-control";
import { NotificationTypeIcon } from "@/components/notifications/notification-type-icon";
import type { NotificationResponse } from "@/lib/api/types";
import type { NotificationsListDict } from "@/components/notifications/types";

const PAGE_SIZE = 20;

export function NotificationsListView({
  lang,
  dict,
}: {
  lang: Locale;
  dict: NotificationsListDict;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const isAuthenticated = sessionStatus === "authenticated" && !!accessToken;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: notificationsKey.list(page),
    queryFn: () => notificationsApi.list(accessToken!, lang, { page, page_size: PAGE_SIZE }),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(accessToken!, lang, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey.all() }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(accessToken!, lang),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey.all() }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(accessToken!, lang, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey.all() }),
  });

  function handleDeleteClick(id: string) {
    setPendingDeleteId(id);
  }

  function handleDeleteCancel() {
    setPendingDeleteId(null);
  }

  function handleDeleteConfirm() {
    if (!pendingDeleteId) return;
    deleteMutation.mutate(pendingDeleteId);
    setPendingDeleteId(null);
  }

  function handleRowClick(notification: NotificationResponse) {
    if (!notification.is_read) markReadMutation.mutate(notification.id);
    const target = getNotificationTarget(notification, lang);
    if (target) router.push(target);
  }

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      {/* Delete Confirmation Modal */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-notification-title"
        >
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-2xl">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
              <Trash2 className="size-6 text-red-500" />
            </div>
            <h2
              id="delete-notification-title"
              className="mb-2 text-lg font-bold text-foreground"
            >
              {dict.deleteConfirmTitle}
            </h2>
            <p className="mb-8 text-sm text-muted-foreground">
              {dict.deleteConfirmBody}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
              >
                {dict.deleteConfirmCancel}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  dict.deleteConfirmDelete
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{dict.pageTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dict.pageSubtitle}</p>
        </div>
        {hasUnread && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-border/40 disabled:opacity-50"
          >
            {dict.markAllRead}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <AlertCircle className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">{dict.errorTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.errorSubtitle}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            {dict.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <Bell className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">{dict.emptyTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.emptySubtitle}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-2">
            {items.map((notification) => (
              <li
                key={notification.id}
                className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4"
              >
                <button
                  type="button"
                  onClick={() => handleRowClick(notification)}
                  className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                >
                  <NotificationTypeIcon type={notification.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p
                        className={`text-sm ${notification.is_read ? "font-medium text-foreground" : "font-semibold text-foreground"}`}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatThreadTimestamp(notification.created_at, lang)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(notification.id)}
                  aria-label={dict.deleteAria}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>

          {data && (
            <PaginationControl pagination={data.pagination} onChangePage={setPage} dict={dict} />
          )}
        </div>
      )}
    </div>
  );
}
