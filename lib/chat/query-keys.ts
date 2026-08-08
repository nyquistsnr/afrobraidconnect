// Centralized so components and the realtime provider can't drift apart —
// invalidateQueries({ queryKey: chatThreadsKey.all() }) partial-matches
// every key built here (inbox pages + the header/tab-bar unread total).
export const chatThreadsKey = {
  all: () => ["chat-threads"] as const,
  list: (page: number) => ["chat-threads", "list", page] as const,
  unreadTotal: () => ["chat-threads", "unread-total"] as const,
};

export const chatMessagesKey = (threadId: string) =>
  ["chat-thread-messages", threadId] as const;
