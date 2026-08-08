export type SearchPanelKey = "where" | "style" | "when";

export interface SelectedLocation {
  label: string;
  isNearby?: boolean;
  lat?: number;
  lng?: number;
}

export interface SelectedStyle {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface SelectedDateRange {
  from?: Date;
  to?: Date;
}

export interface WherePanelDict {
  searchPlaceholder: string;
  nearbyLabel: string;
  nearbyDescription: string;
  recentHeading: string;
  suggestedHeading: string;
  searchResultsHeading: string;
  noResults: string;
  geoDeniedMessage: string;
  geoUnsupportedMessage: string;
}

export interface StylePanelDict {
  searchPlaceholder: string;
  noResults: string;
  loadError: string;
  popularHeading: string;
}

export interface WhenPanelDict {
  heading: string;
  clearDates: string;
  closeCalendar: string;
}

export interface SearchDict {
  where: WherePanelDict;
  style: StylePanelDict;
  when: WhenPanelDict;
  clearAll: string;
  searchCta: string;
}
