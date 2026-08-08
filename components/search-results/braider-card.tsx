"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin, Star } from "lucide-react";
import type { BraiderSearchItem } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { SearchLinkContext } from "@/lib/search-query";
import { displayStyle, formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import type { SearchResultsDict } from "@/components/search-results/types";

export function BraiderCard({
  item,
  isHighlighted,
  onHover,
  lang,
  searchLinkContext,
  dict,
}: {
  item: BraiderSearchItem;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  lang: Locale;
  searchLinkContext: SearchLinkContext;
  dict: SearchResultsDict;
}) {
  const style = displayStyle(item);
  const locationLine = [item.location?.city, item.location?.country]
    .filter(Boolean)
    .join(", ");
  // Only carry the style filter over when it's the one the search actually
  // matched on — not the cheapest-style fallback used just to show a price.
  // The rest of the search (location/date/radius) carries over too, so both
  // the braider's own availability calendar and the header search bar on
  // their profile page reflect what the customer was already looking for
  // instead of resetting.
  const params = new URLSearchParams();
  if (item.matched_style) {
    params.set("style_id", item.matched_style.style_id);
    params.set("style_name", item.matched_style.name);
  }
  if (searchLinkContext.date_from) params.set("date_from", searchLinkContext.date_from);
  if (searchLinkContext.date_to) params.set("date_to", searchLinkContext.date_to);
  if (searchLinkContext.location) params.set("location", searchLinkContext.location);
  if (searchLinkContext.lat) params.set("lat", searchLinkContext.lat);
  if (searchLinkContext.lng) params.set("lng", searchLinkContext.lng);
  if (searchLinkContext.country_code) params.set("country_code", searchLinkContext.country_code);
  if (searchLinkContext.radius_km) params.set("radius_km", searchLinkContext.radius_km);
  const qs = params.toString();
  const href = `/${lang}/braiders/${item.id}${qs ? `?${qs}` : ""}`;

  return (
    <Link
      href={href}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      className={`group flex flex-col gap-3 rounded-2xl border p-3 outline-none transition-all ${
        isHighlighted
          ? "border-foreground shadow-md"
          : "border-border/60 hover:border-foreground/25 hover:shadow-sm"
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-border/50">
        {item.cover_photo_url ? (
          <Image
            src={item.cover_photo_url}
            alt={formatTemplate(dict.imageAlt, {
              name: item.business_name ?? "",
            })}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 22vw, (min-width: 640px) 42vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageOff className="size-8 text-icon-muted" />
          </div>
        )}
        {item.location?.offers_mobile && (
          <span className="absolute top-2 left-2 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
            {dict.mobileService}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {item.logo_url && (
              <span className="relative size-6 shrink-0 overflow-hidden rounded-full border border-border bg-border/30">
                <Image
                  src={item.logo_url}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              </span>
            )}
            <h3 className="truncate text-sm font-semibold text-foreground">
              {item.business_name ?? "—"}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            {item.rating && (
              <span className="flex items-center gap-0.5 font-bold text-foreground">
                <Star className="size-3 fill-current" />
                {Number(item.rating).toFixed(2)}
              </span>
            )}
            {item.rating && item.distance_km != null && <span>·</span>}
            {item.distance_km != null && (
              <span>{formatTemplate(dict.distanceAway, { distance: item.distance_km })}</span>
            )}
          </div>
        </div>
        {locationLine && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {locationLine}
          </p>
        )}
        {style && (
          <p className="truncate text-xs text-muted-foreground">{style.name}</p>
        )}
        {style && (
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatTemplate(dict.fromPrice, {
              price: formatPrice(style.base_price),
            })}
          </p>
        )}
      </div>
    </Link>
  );
}
