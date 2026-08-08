import type { BraiderOfferedStyle } from "@/lib/api/types";
import { formatTemplate } from "@/lib/format-template";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function formatDuration(
  totalMinutes: number,
  dict: BraiderDetailDict
): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return formatTemplate(dict.durationMinutes, { minutes: totalMinutes });
  }
  if (minutes === 0) {
    return formatTemplate(dict.durationHours, { hours });
  }
  return formatTemplate(dict.durationHoursMinutes, { hours, minutes });
}

// Base/variation price plus every required addon and any optional addons
// the customer has picked — the sidebar's running estimate.
export function calcEstimatedTotal(
  style: BraiderOfferedStyle,
  selectedVariationId: string | null,
  selectedAddonIds: ReadonlySet<string>
): number {
  const variation = style.variations.find((v) => v.id === selectedVariationId);
  const base = variation ? Number(variation.price) : Number(style.base_price);
  const addonsTotal = style.addons
    .filter((addon) => addon.is_required || selectedAddonIds.has(addon.id))
    .reduce((sum, addon) => sum + Number(addon.price), 0);
  return base + addonsTotal;
}
