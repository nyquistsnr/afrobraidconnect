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
  // City-centre coordinates, so picking a suggestion runs the same
  // radius search (map ring, distance chips, "Search this area") as a typed
  // address instead of a country-wide one.
  lat: number;
  lng: number;
  // ISO 3166-1 alpha-2 — kept as a fallback country_code filter.
  countryCode: string;
  icon: string;
}

export const searchDestinations: SearchDestination[] = [
  { id: "lagos", lat: 6.5244, lng: 3.3792, city: "Lagos", country: "Nigeria", countryCode: "NG", icon: "🌴" },
  { id: "accra", lat: 5.6037, lng: -0.187, city: "Accra", country: "Ghana", countryCode: "GH", icon: "🥁" },
  { id: "paris", lat: 48.8566, lng: 2.3522, city: "Paris", country: "France", countryCode: "FR", icon: "🗼" },
  { id: "berlin", lat: 52.52, lng: 13.405, city: "Berlin", country: "Germany", countryCode: "DE", icon: "🐻" },
  { id: "london", lat: 51.5074, lng: -0.1278, city: "London", country: "United Kingdom", countryCode: "GB", icon: "🎡" },
  { id: "amsterdam", lat: 52.3676, lng: 4.9041, city: "Amsterdam", country: "Netherlands", countryCode: "NL", icon: "🌷" },
  { id: "atlanta", lat: 33.749, lng: -84.388, city: "Atlanta", country: "United States", countryCode: "US", icon: "🍑" },
  { id: "new-york", lat: 40.7128, lng: -74.006, city: "New York", country: "United States", countryCode: "US", icon: "🗽" },
  { id: "toronto", lat: 43.6532, lng: -79.3832, city: "Toronto", country: "Canada", countryCode: "CA", icon: "🍁" },
  { id: "johannesburg", lat: -26.2041, lng: 28.0473, city: "Johannesburg", country: "South Africa", countryCode: "ZA", icon: "🦁" },
];
