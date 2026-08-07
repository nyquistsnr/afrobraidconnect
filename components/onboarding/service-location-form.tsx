"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import type { Country } from "react-phone-number-input";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import type { ServiceLocationResponse, LocationType } from "@/lib/api/types";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchableCountrySelect } from "@/components/ui/searchable-country-select";
import { AddressInput } from "@/components/ui/address-input";
import { ComboboxInput } from "@/components/ui/combobox-input";

function MapPanController({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && center.lat !== 0 && center.lng !== 0) {
      map.panTo(center);
      map.setZoom(14);
    }
  }, [map, center]);
  return null;
}

function MapCircle({ center, radiusKm }: { center: { lat: number; lng: number } | null; radiusKm: number }) {
  const map = useMap();
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !center) return;
    const c = new window.google.maps.Circle({
      map,
      center,
      radius: radiusKm * 1000, // convert km to meters
      fillColor: "#000000",
      fillOpacity: 0.1,
      strokeColor: "#000000",
      strokeOpacity: 0.3,
      strokeWeight: 2,
    });
    setCircle(c);
    return () => {
      c.setMap(null);
    };
  }, [map, center]);

  useEffect(() => {
    if (circle && center) {
      circle.setRadius(radiusKm * 1000);
      circle.setCenter(center);
    }
  }, [circle, radiusKm, center]);

  return null;
}

export function ServiceLocationForm({
  dict,
  common,
  lang,
  initialData,
}: {
  dict: Dictionary["onboarding"]["serviceLocation"];
  common: Dictionary["common"];
  lang: Locale;
  initialData: ServiceLocationResponse;
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const [country, setCountry] = useState<Country | "">((initialData.country as Country) ?? "");
  const [locationType, setLocationType] = useState<LocationType | "">(initialData.location_type ?? "");
  const [salonName, setSalonName] = useState(initialData.salon_name ?? "");
  const [addressLine1, setAddressLine1] = useState(initialData.address_line1 ?? "");
  const [addressLine2, setAddressLine2] = useState(initialData.address_line2 ?? "");
  const [city, setCity] = useState(initialData.city ?? "");
  const [postalCode, setPostalCode] = useState(initialData.postal_code ?? "");
  const [lat, setLat] = useState<number | null>(initialData.latitude ?? null);
  const [lng, setLng] = useState<number | null>(initialData.longitude ?? null);

  const [offersMobile, setOffersMobile] = useState(initialData.offers_mobile ?? false);
  const [travelRadiusKm, setTravelRadiusKm] = useState(initialData.travel_radius_km?.toString() ?? "");
  const [travelFee, setTravelFee] = useState(initialData.travel_fee?.toString() ?? "");

  const saveMutation = useMutation({
    mutationFn: async () => {
      return onboardingApi.updateServiceLocation(session!.accessToken, {
        location_type: locationType || null,
        salon_name: isFixedLocation && locationType === "SALON" ? (salonName.trim() || null) : null,
        address_line1: isFixedLocation ? (addressLine1.trim() || null) : null,
        address_line2: isFixedLocation ? (addressLine2.trim() || null) : null,
        city: city.trim() || null,
        postal_code: isFixedLocation ? (postalCode.trim() || null) : null,
        country: country || null,
        latitude: lat ?? null,
        longitude: lng ?? null,
        offers_mobile: offersMobile,
        travel_radius_km: offersMobile && travelRadiusKm ? parseInt(travelRadiusKm, 10) : null,
        travel_fee: offersMobile && travelFee ? parseFloat(travelFee) : null,
      });
    },
    onSuccess: (data) => {
      toast.success(dict.toasts.saved);
      if (data.is_complete) {
        router.push(`/${lang}/onboarding`);
      } else {
        toast.error(dict.toasts.incomplete);
      }
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const hasChanged =
      locationType !== (initialData.location_type ?? "") ||
      salonName !== (initialData.salon_name ?? "") ||
      addressLine1 !== (initialData.address_line1 ?? "") ||
      addressLine2 !== (initialData.address_line2 ?? "") ||
      city !== (initialData.city ?? "") ||
      postalCode !== (initialData.postal_code ?? "") ||
      country !== (initialData.country ?? "") ||
      lat !== (initialData.latitude ?? null) ||
      lng !== (initialData.longitude ?? null) ||
      offersMobile !== (initialData.offers_mobile ?? false) ||
      travelRadiusKm !== (initialData.travel_radius_km?.toString() ?? "") ||
      travelFee !== (initialData.travel_fee?.toString() ?? "");

    if (!hasChanged && initialData.is_complete) {
      router.push(`/${lang}/onboarding`);
      return;
    }

    saveMutation.mutate();
  }

  const isFixedLocation = locationType === "HOME_STUDIO" || locationType === "SALON";
  const numLat = Number(lat);
  const numLng = Number(lng);
  const hasCoordinates = lat !== null && lng !== null && !isNaN(numLat) && !isNaN(numLng);
  const currentCenter = hasCoordinates ? { lat: numLat, lng: numLng } : null;

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
      <div className="w-full">
        <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <SearchableCountrySelect
              label={dict.countryLabel}
              value={country}
              onChange={(val) => setCountry(val)}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <Select
              label={dict.locationTypeLabel}
              showLabel
              value={locationType}
              onChange={(val) => setLocationType(val as LocationType | "")}
              options={[
                { value: "", label: "-- Select --" },
                { value: "HOME_STUDIO", label: dict.locationTypes.homeStudio },
                { value: "SALON", label: dict.locationTypes.salon },
              ]}
            />

            {locationType === "SALON" && (
              <Input
                label={dict.salonNameLabel}
                showLabel
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder={dict.salonNamePlaceholder}
              />
            )}

            {/* Address Search available if they've picked a country AND either a fixed location or mobile */}
            {(isFixedLocation || offersMobile) && country && (
              <AddressInput
                label={isFixedLocation ? dict.addressLine1Label : dict.cityLabel}
                showLabel
                placeholder={isFixedLocation ? dict.addressLine1Placeholder : dict.cityPlaceholder}
                countryCode={country}
                defaultValue={isFixedLocation ? addressLine1 : city}
                onAddressSelected={(address) => {
                  setAddressLine1(address.line1);
                  setCity(address.city);
                  setPostalCode(address.postalCode);
                  setLat(address.lat);
                  setLng(address.lng);
                }}
              />
            )}

            {isFixedLocation && (
              <Input
                label={dict.addressLine2Label}
                showLabel
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder={dict.addressLine2Placeholder}
              />
            )}

            {(isFixedLocation || offersMobile) && (
              <div className="grid grid-cols-2 gap-4">
                {isFixedLocation && (
                  <Input
                    label={dict.postalCodeLabel}
                    showLabel
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder={dict.postalCodePlaceholder}
                  />
                )}
                {isFixedLocation && (
                  <div className="col-span-2 sm:col-span-1">
                    <Input
                      label={dict.cityLabel}
                      showLabel
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={dict.cityPlaceholder}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={offersMobile}
                onChange={(e) => setOffersMobile(e.target.checked)}
                className="size-4 rounded border-input bg-background text-brand accent-brand focus:ring-brand"
              />
              <span className="text-sm font-medium text-foreground">
                {dict.offersMobileLabel}
              </span>
            </label>

            {offersMobile && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <ComboboxInput
                  label={dict.travelRadiusLabel}
                  showLabel
                  type="number"
                  min="1"
                  max="500"
                  value={travelRadiusKm}
                  onChange={(e) => setTravelRadiusKm(e.target.value)}
                  options={["5", "10", "15", "20", "25", "50", "100"]}
                />
                <Input
                  label={dict.travelFeeLabel}
                  showLabel
                  type="number"
                  min="0"
                  step="0.01"
                  value={travelFee}
                  onChange={(e) => setTravelFee(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Map Display */}
          {hasCoordinates && (
            <div className="h-64 w-full overflow-hidden rounded-xl border border-border bg-muted">
              <Map
                defaultZoom={13}
                defaultCenter={currentCenter!}
                gestureHandling="cooperative"
                disableDefaultUI={true}
              >
                <Marker position={currentCenter} />
                <MapPanController center={currentCenter} />
                {offersMobile && travelRadiusKm && (
                  <MapCircle center={currentCenter} radiusKm={parseInt(travelRadiusKm, 10)} />
                )}
              </Map>
            </div>
          )}

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? common.loading : dict.continue}
          </Button>
        </form>
      </div>
    </APIProvider>
  );
}
