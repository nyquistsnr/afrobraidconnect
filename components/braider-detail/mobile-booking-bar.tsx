"use client";

import { toast } from "react-toastify";
import type { AvailableSlotResponse, BraiderOfferedStyle } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/braider-pricing";
import {
  calcEstimatedTotal,
  comingSoonMessage,
  ctaLabel,
} from "@/components/braider-detail/format";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

// Sits directly above the app-wide MobileTabBar (which is ~60px tall) so the
// two fixed bars stack cleanly instead of overlapping.
export function MobileBookingBar({
  selectedStyle,
  selectedVariationId,
  selectedAddonIds,
  selectedSlot,
  lang,
  dict,
}: {
  selectedStyle: BraiderOfferedStyle | null;
  selectedVariationId: string | null;
  selectedAddonIds: ReadonlySet<string>;
  selectedSlot: AvailableSlotResponse | null;
  lang: Locale;
  dict: BraiderDetailDict;
}) {
  const total = selectedStyle
    ? calcEstimatedTotal(selectedStyle, selectedVariationId, selectedAddonIds)
    : null;

  function handleCta() {
    toast.info(comingSoonMessage(dict, selectedSlot, lang));
  }

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-surface px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {dict.sidebar.startingFrom}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {total != null ? `€${formatPrice(total)}` : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCta}
          disabled={!selectedStyle}
          className="shrink-0 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ctaLabel(dict, !!selectedStyle, !!selectedSlot)}
        </button>
      </div>
    </div>
  );
}
