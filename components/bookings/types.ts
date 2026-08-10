export interface BookingStatusDict {
  PENDING_PAYMENT: string;
  CONFIRMED: string;
  IN_PROGRESS: string;
  COMPLETED: string;
  NO_SHOW: string;
  CANCELLED_BY_CUSTOMER: string;
  CANCELLED_BY_BRAIDER: string;
  CANCELLED_NO_PAYMENT: string;
  EXPIRED: string;
  DISPUTED: string;
}

export interface BookingsListDict {
  pageTitle: string;
  pageSubtitle: string;
  tabUpcoming: string;
  tabPast: string;
  tabAll: string;
  searchPlaceholder: string;
  resultsCountOne: string;
  resultsCountOther: string;
  emptyUpcomingTitle: string;
  emptyUpcomingSubtitle: string;
  emptyPastTitle: string;
  emptyPastSubtitle: string;
  emptySearchTitle: string;
  emptySearchSubtitle: string;
  exploreCta: string;
  errorTitle: string;
  errorSubtitle: string;
  retry: string;
  previousPage: string;
  nextPage: string;
  pageOf: string;
  referencePrefix: string;
  rescheduleButton: string;
}

export interface BookingDetailDict {
  rescheduleTitle: string;
  rescheduleButton: string;
  rescheduleConfirm: string;
  rescheduleSuccess: string;
  rescheduleError: string;
  rescheduleLoadError: string;
  rescheduleNoSlots: string;
  rescheduleCancel: string;
  backToBookings: string;
  loadErrorTitle: string;
  loadErrorSubtitle: string;
  backToBookingsCta: string;
  referenceLabel: string;
  bookedOnLabel: string;
  appointmentLabel: string;
  durationLabel: string;
  durationMinutes: string;
  durationHours: string;
  durationHoursMinutes: string;
  locationLabel: string;
  locationInPersonValue: string;
  locationMobileValue: string;
  viewProfileCta: string;
  includedTitle: string;
  priceDetailsTitle: string;
  subtotalLabel: string;
  platformFeeLabel: string;
  vatLabel: string;
  totalLabel: string;
  depositPaidLabel: string;
  balanceLabel: string;
  paymentsTitle: string;
  paymentPurposeFull: string;
  paymentPurposeDeposit: string;
  paymentPurposeBalance: string;
  paymentStatusPending: string;
  paymentStatusSucceeded: string;
  paymentStatusFailed: string;
  paymentStatusCanceled: string;
  cancellationTitle: string;
  cancellationBeforeCutoff: string;
  cancellationAfterCutoff: string;
  balanceRetry: BalanceRetryDict;
}

export interface BalanceRetryDict {
  happyPathNotice: string;
  failedBannerText: string;
  cardDeclinedSubtitle: string;
  authRequiredSubtitle: string;
  addCardButton: string;
  confirmPaymentButton: string;
  paymentComplete: string;
  abandonedNotice: string;
  errorModalTitle: string;
}
