"use client";

import type { NotificationResponse, PaginatedData } from "@/lib/api/types";

// Last-seen notifications kept on the device so the bell's badge and panel
// are filled from the very first paint after a reload (stale-while-
// revalidate: React Query shows this as placeholder data while the fresh
// request runs). Scoped to one user id and wiped on logout, so another
// account on a shared device never sees it.
const KEY = "afrobraid:notifications-cache";

interface CacheShape {
  userId: string;
  panel?: PaginatedData<NotificationResponse>;
  unread?: number;
}

function read(): CacheShape | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : null;
  } catch {
    return null;
  }
}

export function readNotificationCache(userId: string | undefined): CacheShape | null {
  if (!userId || typeof window === "undefined") return null;
  const cache = read();
  return cache?.userId === userId ? cache : null;
}

export function writeNotificationCache(
  userId: string | undefined,
  patch: Omit<Partial<CacheShape>, "userId">
) {
  if (!userId) return;
  try {
    const current = readNotificationCache(userId) ?? { userId };
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch, userId }));
  } catch {
    // Storage unavailable — the bell just loads from the network.
  }
}

export function clearNotificationCache() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
}
