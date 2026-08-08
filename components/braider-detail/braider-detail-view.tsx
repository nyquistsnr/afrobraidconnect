"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";
import type {
  AvailableSlotResponse,
  BookingCalculationPreviewResponse,
  BraiderDetailResponse,
} from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { bookingCalculationsApi } from "@/lib/api/booking-calculations-client";
import { ApiError } from "@/lib/api/auth-client";
import { formatClientAddress, fromISODateLocal } from "@/components/braider-detail/format";
import { PhotoGallery } from "@/components/braider-detail/photo-gallery";
import { StyleMenu } from "@/components/braider-detail/style-menu";
import {
  ServiceLocationSection,
  type ClientAddress,
  type ServiceMode,
} from "@/components/braider-detail/service-location-section";
import { AvailabilitySection } from "@/components/braider-detail/availability-section";
import { BookingSidebar } from "@/components/braider-detail/booking-sidebar";
import { MobileBookingBar } from "@/components/braider-detail/mobile-booking-bar";
import { ShareButton } from "@/components/braider-detail/share-button";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function BraiderDetailView({
  braider,
  lang,
  initialStyleId,
  initialDateFrom,
  dict,
  errorsDict,
}: {
  braider: BraiderDetailResponse;
  lang: Locale;
  initialStyleId?: string | null;
  initialDateFrom?: string | null;
  dict: BraiderDetailDict;
  errorsDict: Dictionary["common"]["errors"];
}) {
  const initialDate = initialDateFrom ? fromISODateLocal(initialDateFrom) : null;
  const router = useRouter();
  // No default style is preselected on load — selecting one is what kicks
  // off the preview/availability API calls, so an auto-picked "cheapest
  // style" default would fire those requests before the user has done
  // anything. A style_id carried over from the search page's style filter
  // (via the card's link) is a real user action, so it's still honored —
  // but only if this braider actually offers it.
  const initialStyle = initialStyleId
    ? (braider.styles.find((s) => s.style_id === initialStyleId) ?? null)
    : null;

  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(
    initialStyle?.style_id ?? null
  );
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    null
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlotResponse | null>(
    null
  );
  const offersMobile = !!braider.location?.offers_mobile;
  const [serviceMode, setServiceMode] = useState<ServiceMode>("in_person");
  const [clientAddress, setClientAddress] = useState<ClientAddress | null>(null);
  const [showAddressError, setShowAddressError] = useState(false);

  const selectedStyle =
    braider.styles.find((s) => s.style_id === selectedStyleId) ?? null;
  // "Mobile" only actually applies once a valid address has been chosen —
  // until then, price/preview/creation all behave as if in-person, so the
  // total never blanks out while the customer is mid-autocomplete.
  const isMobileBooking = offersMobile && serviceMode === "mobile";
  const hasMobileAddress = isMobileBooking && clientAddress != null;

  function handleServiceModeChange(mode: ServiceMode) {
    setServiceMode(mode);
    setShowAddressError(false);
  }

  function handleClientAddressChange(address: ClientAddress | null) {
    setClientAddress(address);
    setShowAddressError(false);
  }

  function handleSelectStyle(id: string) {
    setSelectedStyleId(id);
    setSelectedVariationId(null);
    setSelectedAddonIds(new Set());
    setSelectedSlot(null);
  }

  function handleToggleAddon(id: string) {
    setSelectedAddonIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Live, accurate quote (VAT/platform fee/deposit split) for the sidebar —
  // debounced so rapid addon toggles don't spam the rate-limited endpoint.
  // Cheap client math (format.ts's resolvePricing) covers the gap while
  // this is in flight so the price never blanks out.
  const previewInput = useMemo(() => {
    if (!selectedStyleId) return null;
    return {
      braider_id: braider.id,
      style_id: selectedStyleId,
      braider_style_variation_id: selectedVariationId ?? undefined,
      braider_style_addon_ids:
        selectedAddonIds.size > 0 ? [...selectedAddonIds] : undefined,
      ...(hasMobileAddress && clientAddress
        ? {
            is_mobile: true,
            client_address: formatClientAddress(clientAddress),
            client_latitude: String(clientAddress.lat),
            client_longitude: String(clientAddress.lng),
          }
        : {}),
    };
  }, [
    braider.id,
    selectedStyleId,
    selectedVariationId,
    selectedAddonIds,
    hasMobileAddress,
    clientAddress,
  ]);
  const debouncedPreviewInput = useDebouncedValue(previewInput, 400);

  const {
    data: preview,
    isError: previewIsError,
    error: previewErrorObj,
  } = useQuery<BookingCalculationPreviewResponse, ApiError>({
    queryKey: ["booking-calculation-preview", debouncedPreviewInput],
    queryFn: () => bookingCalculationsApi.preview(debouncedPreviewInput!),
    enabled: debouncedPreviewInput != null,
    staleTime: 15_000,
    // A rejected quote (invalid selection, out-of-range address, etc.) is
    // deterministic — retrying just delays surfacing it to the customer.
    retry: false,
  });

  // The debounced address can still land outside the braider's travel
  // radius — the backend is the only source of truth for that (it knows
  // the exact route distance), so this only surfaces once the quote
  // request actually comes back rejected.
  const mobileLocationOutOfRange =
    hasMobileAddress &&
    previewIsError &&
    previewErrorObj instanceof ApiError &&
    previewErrorObj.code === "MOBILE_LOCATION_OUT_OF_RANGE";

  const createCalculationMutation = useMutation({
    mutationFn: () => {
      if (!selectedStyle || !selectedSlot) {
        return Promise.reject(new Error("Missing style or slot selection"));
      }
      return bookingCalculationsApi.create({
        braider_id: braider.id,
        style_id: selectedStyle.style_id,
        braider_style_variation_id: selectedVariationId ?? undefined,
        braider_style_addon_ids:
          selectedAddonIds.size > 0 ? [...selectedAddonIds] : undefined,
        ...(hasMobileAddress && clientAddress
          ? {
              is_mobile: true,
              client_address: formatClientAddress(clientAddress),
              client_latitude: String(clientAddress.lat),
              client_longitude: String(clientAddress.lng),
            }
          : {}),
      });
    },
    onSuccess: (calculation) => {
      const params = new URLSearchParams({
        calculation_id: calculation.id,
        starts_at: selectedSlot!.start_at,
      });
      router.push(`/${lang}/braiders/${braider.id}/book?${params.toString()}`);
    },
    onError: () => {
      toast.error(dict.sidebar.quoteErrorToast);
    },
  });

  function handleContinue() {
    if (!selectedStyle) return;
    if (isMobileBooking && (!clientAddress || mobileLocationOutOfRange)) {
      if (!clientAddress) setShowAddressError(true);
      document
        .getElementById("service-location-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!selectedSlot) {
      document
        .getElementById("availability-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    createCalculationMutation.mutate();
  }

  const businessName = braider.business_name ?? "";
  const locationLine = [braider.location?.city, braider.location?.country]
    .filter(Boolean)
    .join(", ");
  const isSalon = braider.location?.location_type === "SALON";

  return (
    <div className="flex flex-1 flex-col pb-48 lg:pb-16">
      <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between px-4 pt-4 sm:px-6 lg:px-10">
        <Link
          href={`/${lang}/search`}
          onClick={(event) => {
            // Prefer browser history so the previous search's filters and
            // scroll position are preserved; the href is only a fallback
            // for direct links with no history to go back to.
            if (window.history.length > 1) {
              event.preventDefault();
              router.back();
            }
          }}
          className="flex items-center gap-2 rounded-full py-2 pr-3 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
        >
          <ArrowLeft className="size-4" />
          {dict.backToSearch}
        </Link>
        <ShareButton
          title={businessName}
          label={dict.shareLabel}
          copiedMessage={dict.linkCopied}
          failedMessage={dict.shareFailed}
        />
      </div>

      <PhotoGallery
        images={braider.portfolio}
        businessName={businessName}
        dict={dict}
      />

      <div className="mx-auto grid w-full max-w-[1760px] grid-cols-1 gap-10 px-4 pt-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-4">
            {braider.logo_url && (
              <span className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border bg-border/30">
                <Image
                  src={braider.logo_url}
                  alt={formatTemplate(dict.logoAlt, { name: businessName })}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {businessName || "—"}
              </h1>
              {locationLine && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  {locationLine}
                </p>
              )}
            </div>
          </div>

          {braider.location?.offers_mobile && (
            <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-border/10 px-4 py-3.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="font-semibold text-foreground">
                  {dict.mobileServiceTitle}
                </span>
                <span className="text-muted-foreground">
                  {braider.location.travel_radius_km != null &&
                    `${formatTemplate(dict.mobileServiceRadius, {
                      radius: braider.location.travel_radius_km,
                    })} · `}
                  {braider.location.travel_fee &&
                  Number(braider.location.travel_fee) > 0
                    ? formatTemplate(dict.mobileServiceFee, {
                        fee: formatPrice(braider.location.travel_fee),
                      })
                    : dict.mobileServiceFeeFree}
                </span>
              </div>
            </div>
          )}

          <section className="flex flex-col gap-3 border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">
              {dict.aboutTitle}
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
              {braider.bio || dict.noBio}
            </p>
          </section>

          <section className="flex flex-col gap-4 border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">
              {dict.menuTitle}
            </h2>
            <StyleMenu
              styles={braider.styles}
              selectedStyleId={selectedStyleId}
              onSelectStyle={handleSelectStyle}
              selectedVariationId={selectedVariationId}
              onSelectVariation={setSelectedVariationId}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={handleToggleAddon}
              dict={dict}
            />
          </section>

          {selectedStyle && offersMobile && braider.location && (
            <div id="service-location-section" className="scroll-mt-24">
              <ServiceLocationSection
                businessName={businessName}
                location={braider.location}
                isSalon={isSalon}
                serviceMode={serviceMode}
                onServiceModeChange={handleServiceModeChange}
                clientAddress={clientAddress}
                onClientAddressChange={handleClientAddressChange}
                addressError={
                  mobileLocationOutOfRange
                    ? errorsDict.mobileLocationOutOfRange
                    : showAddressError
                      ? dict.serviceLocation.addressRequiredError
                      : undefined
                }
                dict={dict.serviceLocation}
              />
            </div>
          )}

          {selectedStyle && (
            <div id="availability-section" className="scroll-mt-24">
              <AvailabilitySection
                braiderId={braider.id}
                style={selectedStyle}
                lang={lang}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                initialDate={initialDate}
                dict={dict}
              />
            </div>
          )}

          {braider.location && (
            <section className="flex flex-col gap-3 border-t border-border pt-8">
              <h2 className="text-lg font-semibold text-foreground">
                {dict.locationTitle}
              </h2>
              <div className="flex flex-col gap-1 text-sm text-foreground/90">
                {isSalon && braider.location.salon_name && (
                  <p className="font-medium">{braider.location.salon_name}</p>
                )}
                {isSalon && braider.location.address_line1 && (
                  <p>
                    {[
                      braider.location.address_line1,
                      braider.location.address_line2,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {isSalon && braider.location.postal_code && (
                  <p>
                    {[braider.location.postal_code, braider.location.city]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                {!isSalon && locationLine && <p>{locationLine}</p>}
                {!isSalon && (
                  <p className="text-muted-foreground">
                    {dict.locationExactHidden}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-28">
            <BookingSidebar
              selectedStyle={selectedStyle}
              selectedVariationId={selectedVariationId}
              selectedAddonIds={selectedAddonIds}
              selectedSlot={selectedSlot}
              preview={preview ?? null}
              onContinue={handleContinue}
              isContinuing={createCalculationMutation.isPending}
              lang={lang}
              dict={dict}
            />
          </div>
        </div>
      </div>

      <MobileBookingBar
        selectedStyle={selectedStyle}
        selectedVariationId={selectedVariationId}
        selectedAddonIds={selectedAddonIds}
        selectedSlot={selectedSlot}
        preview={preview ?? null}
        onContinue={handleContinue}
        isContinuing={createCalculationMutation.isPending}
        dict={dict}
      />
    </div>
  );
}
