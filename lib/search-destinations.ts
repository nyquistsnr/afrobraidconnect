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
  icon: string;
}

export const searchDestinations: SearchDestination[] = [
  { id: "lagos", city: "Lagos", country: "Nigeria", icon: "🌴" },
  { id: "accra", city: "Accra", country: "Ghana", icon: "🥁" },
  { id: "paris", city: "Paris", country: "France", icon: "🗼" },
  { id: "berlin", city: "Berlin", country: "Germany", icon: "🐻" },
  { id: "london", city: "London", country: "United Kingdom", icon: "🎡" },
  { id: "amsterdam", city: "Amsterdam", country: "Netherlands", icon: "🌷" },
  { id: "atlanta", city: "Atlanta", country: "United States", icon: "🍑" },
  { id: "new-york", city: "New York", country: "United States", icon: "🗽" },
  { id: "toronto", city: "Toronto", country: "Canada", icon: "🍁" },
  { id: "johannesburg", city: "Johannesburg", country: "South Africa", icon: "🦁" },
];
