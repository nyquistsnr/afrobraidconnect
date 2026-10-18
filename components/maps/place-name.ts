"use client";

// Reverse-geocodes a map position to a town-level name for the header and
// results heading. Deliberately never falls back to a street address (the
// old behavior turned "Wrexham" into "23 Ernest Parry Rd" after a tiny drag);
// UK towns come back as postal_town rather than locality.
export async function placeNameFor(lat: number, lng: number): Promise<string | null> {
  try {
    if (!window.google?.maps?.Geocoder) return null;
    const geocoder = new window.google.maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    for (const type of [
      "locality",
      "postal_town",
      "sublocality",
      "administrative_area_level_2",
    ]) {
      for (const result of results) {
        const match = result.address_components.find((c) => c.types.includes(type));
        if (match) return match.long_name;
      }
    }
  } catch {
    // Over quota / zero results — the caller falls back to a generic label.
  }
  return null;
}
