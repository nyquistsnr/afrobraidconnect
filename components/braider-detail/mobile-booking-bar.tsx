"use client";

import { Loader2 } from "lucide-react";
import type {
  AvailableSlotResponse,
  BookingCalculationPreviewResponse,
  BraiderOfferedStyle,
} from "@/lib/api/types";
import { formatPrice } from "@/lib/braider-pricing";
import { ctaLabel, resolvePricing } from "@/components/braider-detail/format";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

// Sits directly above the app-wide MobileTabBar (which is ~60px tall) so the
// two fixed bars stack cleanly instead of overlapping.
export function MobileBookingBar({
  selectedStyle,
  selectedVariationId,
  selectedAddonIds,
  selectedSlot,
  preview,
  onContinue,
  isContinuing,
  dict,
}: {
  selectedStyle: BraiderOfferedStyle | null;
  selectedVariationId: string | null;
  selectedAddonIds: ReadonlySet<string>;
  selectedSlot: AvailableSlotResponse | null;
  preview: BookingCalculationPreviewResponse | null;
  onContinue: () => void;
  isContinuing: boolean;
  dict: BraiderDetailDict;
}) {
  const pricing = selectedStyle
    ? resolvePricing(selectedStyle, selectedVariationId, selectedAddonIds, preview)
    : null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-surface px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {dict.sidebar.startingFrom}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {pricing ? `€${formatPrice(pricing.total)}` : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedStyle || isContinuing}
          className="flex shrink-0 items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isContinuing && <Loader2 className="size-4 animate-spin" />}
          {isContinuing
            ? dict.sidebar.ctaLoading
            : ctaLabel(dict, !!selectedStyle, !!selectedSlot)}
        </button>
      </div>
    </div>
  );
}
