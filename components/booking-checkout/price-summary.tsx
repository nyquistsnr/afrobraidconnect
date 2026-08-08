import { formatPrice } from "@/lib/braider-pricing";
import type { BookingCheckoutDict } from "@/components/booking-checkout/types";

interface PriceBreakdownFields {
  service_subtotal: string;
  travel_fee: string;
  platform_fee: string;
  vat_total: string;
  total: string;
  deposit_amount: string;
  balance_amount: string;
}

// Shared between the review step (indicative BookingCalculationResponse
// numbers) and the payment/success steps (finalized BookingResponse
// numbers) — both share this shape structurally.
export function PriceSummary({
  breakdown,
  depositNote,
  dict,
}: {
  breakdown: PriceBreakdownFields;
  depositNote?: string | null;
  dict: BookingCheckoutDict;
}) {
  const travelFee = Number(breakdown.travel_fee);
  const depositAmount = Number(breakdown.deposit_amount);
  const total = Number(breakdown.total);
  const hasSplit = depositAmount > 0 && depositAmount < total;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">
        {dict.priceDetailsTitle}
      </h3>
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {dict.serviceSubtotalLabel}
          </span>
          <span className="text-foreground">
            €{formatPrice(breakdown.service_subtotal)}
          </span>
        </div>
        {travelFee > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.travelFeeLabel}</span>
            <span className="text-foreground">
              +€{formatPrice(breakdown.travel_fee)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{dict.platformFeeLabel}</span>
          <span className="text-foreground">
            +€{formatPrice(breakdown.platform_fee)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{dict.vatLabel}</span>
          <span className="text-foreground">
            +€{formatPrice(breakdown.vat_total)}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3 font-semibold text-foreground">
        <span>{dict.totalLabel}</span>
        <span>€{formatPrice(breakdown.total)}</span>
      </div>
      {hasSplit && (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.dueTodayLabel}</span>
            <span className="font-medium text-foreground">
              €{formatPrice(breakdown.deposit_amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{dict.dueLaterLabel}</span>
            <span className="text-foreground">
              €{formatPrice(breakdown.balance_amount)}
            </span>
          </div>
        </div>
      )}
      {depositNote && (
        <p className="text-xs text-muted-foreground">{depositNote}</p>
      )}
    </div>
  );
}
