"use client";

import { toast } from "react-toastify";
import type { AvailableSlotResponse, BraiderOfferedStyle } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/braider-pricing";
import {
  calcEstimatedTotal,
  comingSoonMessage,
  ctaLabel,
  formatDuration,
  formatSlotDateTime,
} from "@/components/braider-detail/format";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function BookingSidebar({
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
  const variation =
    selectedStyle?.variations.find((v) => v.id === selectedVariationId) ?? null;
  const includedAddons = selectedStyle
    ? selectedStyle.addons.filter(
        (a) => a.is_required || selectedAddonIds.has(a.id)
      )
    : [];
  const addonsTotal = includedAddons.reduce((sum, a) => sum + Number(a.price), 0);
  const total = selectedStyle
    ? calcEstimatedTotal(selectedStyle, selectedVariationId, selectedAddonIds)
    : null;

  function handleCta() {
    toast.info(comingSoonMessage(dict, selectedSlot, lang));
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-md">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {dict.sidebar.startingFrom}
      </p>
      <p className="mt-1 text-2xl font-semibold text-foreground">
        {total != null ? `€${formatPrice(total)}` : "—"}
      </p>

      {selectedStyle && (
        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
          <div>
            <p className="font-medium text-foreground">
              {selectedStyle.name}
              {variation ? ` · ${variation.name}` : ""}
            </p>
            {selectedStyle.duration_minutes != null && (
              <p className="text-sm text-muted-foreground">
                {formatDuration(selectedStyle.duration_minutes, dict)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{dict.sidebar.baseLabel}</span>
              <span className="text-foreground">
                €{formatPrice(variation ? variation.price : selectedStyle.base_price)}
              </span>
            </div>
            {includedAddons.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{dict.sidebar.addonsLabel}</span>
                <span className="text-foreground">+€{formatPrice(addonsTotal)}</span>
              </div>
            )}
            {selectedSlot && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{dict.sidebar.timeLabel}</span>
                <span className="text-foreground">
                  {formatSlotDateTime(selectedSlot.start_at, lang)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 font-semibold text-foreground">
            <span>{dict.sidebar.totalLabel}</span>
            <span>€{formatPrice(total ?? 0)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleCta}
        disabled={!selectedStyle}
        className="mt-5 flex w-full items-center justify-center rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ctaLabel(dict, !!selectedStyle, !!selectedSlot)}
      </button>
    </div>
  );
}
