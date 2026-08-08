export interface BraiderDetailSidebarDict {
  startingFrom: string;
  durationLabel: string;
  baseLabel: string;
  addonsLabel: string;
  timeLabel: string;
  subtotalLabel: string;
  travelFeeLabel: string;
  platformFeeLabel: string;
  vatLabel: string;
  totalLabel: string;
  depositLabel: string;
  balanceLabel: string;
  cta: string;
  ctaWithSlot: string;
  ctaNoSelection: string;
  ctaLoading: string;
  previewError: string;
  quoteErrorToast: string;
}

export interface BraiderDetailAvailabilityDict {
  title: string;
  previousMonth: string;
  nextMonth: string;
  noDuration: string;
  notConfigured: string;
  loadError: string;
  retry: string;
  noSlotsForDay: string;
}

export interface BraiderDetailDict {
  backToSearch: string;
  shareLabel: string;
  linkCopied: string;
  shareFailed: string;
  showAllPhotos: string;
  galleryClose: string;
  previousPhoto: string;
  nextPhoto: string;
  photoOf: string;
  noPhotos: string;
  logoAlt: string;
  imageAlt: string;
  mobileServiceTitle: string;
  mobileServiceRadius: string;
  mobileServiceFee: string;
  mobileServiceFeeFree: string;
  aboutTitle: string;
  noBio: string;
  locationTitle: string;
  locationExactHidden: string;
  menuTitle: string;
  menuEmpty: string;
  fromPrice: string;
  durationMinutes: string;
  durationHours: string;
  durationHoursMinutes: string;
  variationsLabel: string;
  addonsLabel: string;
  requiredBadge: string;
  sidebar: BraiderDetailSidebarDict;
  availability: BraiderDetailAvailabilityDict;
  errorTitle: string;
  errorSubtitle: string;
  retry: string;
  notFoundTitle: string;
  notFoundSubtitle: string;
  notFoundCta: string;
}
