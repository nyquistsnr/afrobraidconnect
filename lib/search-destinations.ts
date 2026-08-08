// Curated list of destinations shown in the header's "Where" dropdown.
// Cities were chosen for their relevance to braiding culture and the
// African diaspora, mixed with a few major global hubs — mirroring how
// Airbnb mixes iconic and practical destinations in its suggestion list.
// Icons are representative emoji (landmark/symbol the place is known for)
// rather than photos, keeping the list lightweight and locale-agnostic.
export interface SearchDestination {
  id: string;
  city: string;
  country: string;
  // ISO 3166-1 alpha-2 — used as the /braiders search's country_code filter
  // since these curated destinations carry no lat/lng of their own.
  countryCode: string;
  icon: string;
}

export const searchDestinations: SearchDestination[] = [
  { id: "lagos", city: "Lagos", country: "Nigeria", countryCode: "NG", icon: "🌴" },
  { id: "accra", city: "Accra", country: "Ghana", countryCode: "GH", icon: "🥁" },
  { id: "paris", city: "Paris", country: "France", countryCode: "FR", icon: "🗼" },
  { id: "berlin", city: "Berlin", country: "Germany", countryCode: "DE", icon: "🐻" },
  { id: "london", city: "London", country: "United Kingdom", countryCode: "GB", icon: "🎡" },
  { id: "amsterdam", city: "Amsterdam", country: "Netherlands", countryCode: "NL", icon: "🌷" },
  { id: "atlanta", city: "Atlanta", country: "United States", countryCode: "US", icon: "🍑" },
  { id: "new-york", city: "New York", country: "United States", countryCode: "US", icon: "🗽" },
  { id: "toronto", city: "Toronto", country: "Canada", countryCode: "CA", icon: "🍁" },
  { id: "johannesburg", city: "Johannesburg", country: "South Africa", countryCode: "ZA", icon: "🦁" },
];
