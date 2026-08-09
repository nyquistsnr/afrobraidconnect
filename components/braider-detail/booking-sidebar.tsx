"use client";

import { Loader } from "@/components/ui/loader";
import type {
  AvailableSlotResponse,
  BookingCalculationPreviewResponse,
  BraiderOfferedStyle,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/braider-pricing";
import {
  ctaLabel,
  formatDuration,
  formatSlotDateTime,
  resolvePricing,
} from "@/components/braider-detail/format";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function BookingSidebar({
  selectedStyle,
  selectedVariationId,
  selectedAddonIds,
  selectedSlot,
  preview,
  onContinue,
  isContinuing,
  lang,
  dict,
}: {
  selectedStyle: BraiderOfferedStyle | null;
  selectedVariationId: string | null;
  selectedAddonIds: ReadonlySet<string>;
  selectedSlot: AvailableSlotResponse | null;
  preview: BookingCalculationPreviewResponse | null;
  onContinue: () => void;
  isContinuing: boolean;
  lang: Locale;
  dict: BraiderDetailDict;
}) {
  const variation =
    selectedStyle?.variations.find((v) => v.id === selectedVariationId) ?? null;
  const pricing = selectedStyle
    ? resolvePricing(selectedStyle, selectedVariationId, selectedAddonIds, preview)
    : null;
  const hasPartialDeposit =
    !pricing?.isEstimate &&
    pricing?.depositAmount != null &&
    pricing.depositAmount < pricing.total;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-md">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {dict.sidebar.startingFrom}
      </p>
      <p className="mt-1 text-2xl font-semibold text-foreground">
        {pricing ? `€${formatPrice(pricing.total)}` : "—"}
      </p>

      {selectedStyle && pricing && (
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
              <span className="text-muted-foreground">
                {dict.sidebar.subtotalLabel}
              </span>
              <span className="text-foreground">
                €{formatPrice(pricing.subtotal)}
              </span>
            </div>
            {pricing.travelFee > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {dict.sidebar.travelFeeLabel}
                </span>
                <span className="text-foreground">
                  +€{formatPrice(pricing.travelFee)}
                </span>
              </div>
            )}
            {!pricing.isEstimate && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {dict.sidebar.platformFeeLabel}
                  </span>
                  <span className="text-foreground">
                    +€{formatPrice(pricing.platformFee)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {dict.sidebar.vatLabel}
                  </span>
                  <span className="text-foreground">
                    +€{formatPrice(pricing.vat)}
                  </span>
                </div>
              </>
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
            <span>€{formatPrice(pricing.total)}</span>
          </div>

          {hasPartialDeposit && (
            <p className="text-xs text-muted-foreground">
              {dict.sidebar.depositLabel} €{formatPrice(pricing.depositAmount!)} ·{" "}
              {dict.sidebar.balanceLabel} €{formatPrice(pricing.balanceAmount ?? 0)}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!selectedStyle || isContinuing}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isContinuing && <Loader className="size-4 animate-spin" />}
        {isContinuing
          ? dict.sidebar.ctaLoading
          : ctaLabel(dict, !!selectedStyle, !!selectedSlot)}
      </button>
    </div>
  );
}
