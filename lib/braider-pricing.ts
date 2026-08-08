import type { BraiderSearchItem, MatchedStyleResponse } from "@/lib/api/types";

export function formatPrice(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

// The card/pin price: the style that matched the active search filter, or
// (when no style filter was used) the cheapest style on the braider's menu.
export function displayStyle(item: BraiderSearchItem): MatchedStyleResponse | null {
  if (item.matched_style) return item.matched_style;
  if (!item.styles.length) return null;
  return item.styles.reduce((cheapest, style) =>
    Number(style.base_price) < Number(cheapest.base_price) ? style : cheapest
  );
}
