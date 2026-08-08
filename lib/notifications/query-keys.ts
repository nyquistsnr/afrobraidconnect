export const notificationsKey = {
  all: () => ["notifications"] as const,
  list: (page: number, isRead?: boolean) =>
    ["notifications", "list", page, isRead ?? "all"] as const,
  // Distinct from `list` since the bell's dropdown panel uses a different
  // page_size — same query key with different page_size would otherwise
  // collide in the cache.
  panel: () => ["notifications", "panel"] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};
