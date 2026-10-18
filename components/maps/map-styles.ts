// Afrobraid's own map look, in the spirit of Uber/Bolt: a calm, desaturated
// base so the braiders (the only saturated thing on screen) stand out, with
// warm "home" neutrals instead of Google's default cool greys. Business
// POIs, transit and road shields are hidden so the map reads as a quiet
// neighbourhood, not an ad board; parks and water stay as soft landmarks.
//
// These JSON styles only apply to maps rendered WITHOUT a mapId (cloud
// styling would override them), which is why the search map draws its
// markers as OverlayView-based HTML instead of AdvancedMarkers.
type MapStyles = google.maps.MapTypeStyle[];

const shared: MapStyles = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", stylers: [{ visibility: "on" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", elementType: "labels", stylers: [{ visibility: "off" }] },
];

export const LIGHT_MAP_STYLES: MapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f4f1ec" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#7c746b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f8f6f2" }, { weight: 3 }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#efebe5" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d9d1c6" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#4a433c" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e6dfd5" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fdfcfa" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0e6d8" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e2d3bf" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e3eadb" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cddde3" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8aa3ad" }] },
  ...shared,
];

export const DARK_MAP_STYLES: MapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1b1c1f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8d8a85" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1b1c1f" }, { weight: 3 }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#1f2023" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#34353a" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#c9c4bc" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2b30" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#232428" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3631" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2b2824" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1d2420" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f161c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4b5d68" }] },
  ...shared,
];

export const MAP_BACKGROUND = { light: "#f4f1ec", dark: "#1b1c1f" } as const;
