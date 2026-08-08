"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff, MapPin } from "lucide-react";
import type { BraiderSearchItem } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import { displayStyle, formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import type { SearchResultsDict } from "@/components/search-results/types";

export function BraiderCard({
  item,
  isHighlighted,
  onHover,
  lang,
  dict,
}: {
  item: BraiderSearchItem;
  isHighlighted: boolean;
  onHover: (id: string | null) => void;
  lang: Locale;
  dict: SearchResultsDict;
}) {
  const style = displayStyle(item);
  const locationLine = [item.location?.city, item.location?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/${lang}/braiders/${item.id}`}
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
          {item.distance_km != null && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatTemplate(dict.distanceAway, { distance: item.distance_km })}
            </span>
          )}
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
