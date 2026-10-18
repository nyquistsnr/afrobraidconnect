// Afrobraid's own map look, in the spirit of Uber/Bolt: a cool, crisp
// neutral base so the braiders (the only saturated thing on screen) stand
// out, with one branded signature — main roads carry a light tint of the
// brand copper, so the map reads as "ours" at a glance rather than stock
// Google. Business POIs, transit and road shields are hidden so it reads as
// a calm neighbourhood, not an ad board; parks and water stay as clear
// landmarks to orient by.
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
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
];

export const LIGHT_MAP_STYLES: MapStyles = [
  { elementType: "geometry", stylers: [{ color: "#eef1f4" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7480" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#e7ebef" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#eaf0ec" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#cfd6de" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#2b3138" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#dde2e8" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f6dcc6" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bf9c" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#8a5a36" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d3ebd5" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bcdcf2" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5d8cae" }] },
  ...shared,
];

export const DARK_MAP_STYLES: MapStyles = [
  { elementType: "geometry", stylers: [{ color: "#14171c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a929d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#14171c" }, { weight: 3 }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#181c22" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#151b1d" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2b313a" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d3d8de" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#252a32" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1d2128" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4a3426" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#2f2219" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#d9a27a" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#142520" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1f33" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4f7392" }] },
  ...shared,
];

export const MAP_BACKGROUND = { light: "#eef1f4", dark: "#14171c" } as const;
