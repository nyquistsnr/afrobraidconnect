"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Sparkles } from "lucide-react";
import type { BraiderDetailResponse } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { cheapestOfferedStyle, formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import { PhotoGallery } from "@/components/braider-detail/photo-gallery";
import { StyleMenu } from "@/components/braider-detail/style-menu";
import { BookingSidebar } from "@/components/braider-detail/booking-sidebar";
import { MobileBookingBar } from "@/components/braider-detail/mobile-booking-bar";
import { ShareButton } from "@/components/braider-detail/share-button";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function BraiderDetailView({
  braider,
  lang,
  dict,
}: {
  braider: BraiderDetailResponse;
  lang: Locale;
  dict: BraiderDetailDict;
}) {
  const router = useRouter();
  const defaultStyle = useMemo(
    () => cheapestOfferedStyle(braider.styles),
    [braider.styles]
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(
    defaultStyle?.style_id ?? null
  );
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    null
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set()
  );

  const selectedStyle =
    braider.styles.find((s) => s.style_id === selectedStyleId) ?? null;

  function handleSelectStyle(id: string) {
    setSelectedStyleId(id);
    setSelectedVariationId(null);
    setSelectedAddonIds(new Set());
  }

  function handleToggleAddon(id: string) {
    setSelectedAddonIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const businessName = braider.business_name ?? "";
  const locationLine = [braider.location?.city, braider.location?.country]
    .filter(Boolean)
    .join(", ");
  const isSalon = braider.location?.location_type === "SALON";

  return (
    <div className="flex flex-1 flex-col pb-40 lg:pb-16">
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
              dict={dict}
            />
          </div>
        </div>
      </div>

      <MobileBookingBar
        selectedStyle={selectedStyle}
        selectedVariationId={selectedVariationId}
        selectedAddonIds={selectedAddonIds}
        dict={dict}
      />
    </div>
  );
}
