import type { PaginationControlDict } from "@/components/ui/pagination-control";

export interface NotificationBellDict {
  bellAriaLabel: string;
  panelTitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  markAllRead: string;
  viewAll: string;
  muteSound: string;
  unmuteSound: string;
}

export interface NotificationsListDict extends PaginationControlDict {
  pageTitle: string;
  pageSubtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  errorTitle: string;
  errorSubtitle: string;
  retry: string;
  markAllRead: string;
  deleteAria: string;
}
