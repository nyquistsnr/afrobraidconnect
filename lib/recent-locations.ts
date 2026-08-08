import type { SelectedLocation } from "@/components/search/types";

const STORAGE_KEY = "afrobraid:recent-locations";
const MAX_ENTRIES = 5;

export function getRecentLocations(): SelectedLocation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

// Most-recent-first, deduped by label, capped at MAX_ENTRIES.
export function addRecentLocation(location: SelectedLocation): SelectedLocation[] {
  const existing = getRecentLocations().filter(
    (entry) => entry.label !== location.label
  );
  const updated = [location, ...existing].slice(0, MAX_ENTRIES);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage can be unavailable (private browsing, quota) — recents are
      // a convenience, not critical, so silently skip persistence.
    }
  }
  return updated;
}
