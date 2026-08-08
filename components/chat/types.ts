import type { PaginationControlDict } from "@/components/ui/pagination-control";

export interface ChatInboxDict extends PaginationControlDict {
  navAriaLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  errorTitle: string;
  errorSubtitle: string;
  retry: string;
  flaggedPreview: string;
  noMessagesYet: string;
  unreadAria: string;
}

export interface ChatThreadDict {
  backToInbox: string;
  loadErrorTitle: string;
  loadErrorSubtitle: string;
  loadEarlier: string;
  composerPlaceholder: string;
  sendButton: string;
  flaggedFallback: string;
  translatedFromLabel: string;
  seeOriginal: string;
  seeTranslation: string;
  reportAction: string;
  languageNudgeTitle: string;
  languageNudgeBody: string;
  languageNudgeCta: string;
  languageNudgeDismiss: string;
}

export interface ChatReportDict {
  title: string;
  reasonLabel: string;
  reasons: {
    HARASSMENT: string;
    INAPPROPRIATE_CONTENT: string;
    SPAM: string;
    SCAM_OR_FRAUD: string;
    OFF_PLATFORM_SOLICITATION: string;
    OTHER: string;
  };
  detailsLabel: string;
  detailsPlaceholder: string;
  cancel: string;
  submit: string;
  submitting: string;
  successMessage: string;
  errorMessage: string;
}

export interface ChatButtonDict {
  label: string;
  errorMessage: string;
}
