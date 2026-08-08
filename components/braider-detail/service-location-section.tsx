"use client";

import { Home, MapPin } from "lucide-react";
import type { BraiderLocationResponse } from "@/lib/api/types";
import { AddressInput } from "@/components/ui/address-input";
import { formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import type { BraiderDetailServiceLocationDict } from "@/components/braider-detail/types";

export type ServiceMode = "in_person" | "mobile";

export interface ClientAddress {
  line1: string;
  city: string;
  postalCode: string;
  lat: number;
  lng: number;
}

export function ServiceLocationSection({
  businessName,
  location,
  isSalon,
  serviceMode,
  onServiceModeChange,
  clientAddress,
  onClientAddressChange,
  addressError,
  dict,
}: {
  businessName: string;
  location: BraiderLocationResponse;
  isSalon: boolean;
  serviceMode: ServiceMode;
  onServiceModeChange: (mode: ServiceMode) => void;
  clientAddress: ClientAddress | null;
  onClientAddressChange: (address: ClientAddress | null) => void;
  addressError?: string;
  dict: BraiderDetailServiceLocationDict;
}) {
  const hasFee = location.travel_fee != null && Number(location.travel_fee) > 0;
  const radius = location.travel_radius_km ?? 0;

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground">{dict.title}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onServiceModeChange("in_person")}
          aria-pressed={serviceMode === "in_person"}
          className={`flex flex-col items-start gap-1.5 rounded-2xl border px-4 py-4 text-left transition-colors ${
            serviceMode === "in_person"
              ? "border-foreground"
              : "border-border/70 hover:bg-border/20"
          }`}
        >
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Home className="size-4 shrink-0" />
            {formatTemplate(dict.inPersonLabel, { name: businessName })}
          </span>
          <span className="text-sm text-muted-foreground">
            {isSalon ? dict.inPersonSalonNote : dict.inPersonHiddenNote}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onServiceModeChange("mobile")}
          aria-pressed={serviceMode === "mobile"}
          className={`flex flex-col items-start gap-1.5 rounded-2xl border px-4 py-4 text-left transition-colors ${
            serviceMode === "mobile"
              ? "border-foreground"
              : "border-border/70 hover:bg-border/20"
          }`}
        >
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <MapPin className="size-4 shrink-0" />
            {dict.mobileLabel}
          </span>
          <span className="text-sm text-muted-foreground">
            {hasFee
              ? formatTemplate(dict.mobileFeeNote, {
                  fee: formatPrice(location.travel_fee!),
                  radius,
                })
              : formatTemplate(dict.mobileFreeNote, { radius })}
          </span>
        </button>
      </div>

      {serviceMode === "mobile" && (
        <div className="flex flex-col gap-1.5">
          <AddressInput
            label={dict.addressLabel}
            showLabel
            placeholder={dict.addressPlaceholder}
            countryCode={location.country}
            defaultValue={clientAddress?.line1 ?? ""}
            error={addressError}
            onAddressSelected={(address) =>
              onClientAddressChange({
                line1: address.line1,
                city: address.city,
                postalCode: address.postalCode,
                lat: address.lat,
                lng: address.lng,
              })
            }
          />
          {!addressError && (
            <p className="text-xs text-muted-foreground">{dict.addressHint}</p>
          )}
        </div>
      )}
    </section>
  );
}
