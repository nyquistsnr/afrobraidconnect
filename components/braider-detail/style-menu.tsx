"use client";

import { Check } from "lucide-react";
import type { BraiderOfferedStyle } from "@/lib/api/types";
import { formatPrice } from "@/lib/braider-pricing";
import { formatTemplate } from "@/lib/format-template";
import { formatDuration } from "@/components/braider-detail/format";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function StyleMenu({
  styles,
  selectedStyleId,
  onSelectStyle,
  selectedVariationId,
  onSelectVariation,
  selectedAddonIds,
  onToggleAddon,
  dict,
}: {
  styles: BraiderOfferedStyle[];
  selectedStyleId: string | null;
  onSelectStyle: (id: string) => void;
  selectedVariationId: string | null;
  onSelectVariation: (id: string | null) => void;
  selectedAddonIds: ReadonlySet<string>;
  onToggleAddon: (id: string) => void;
  dict: BraiderDetailDict;
}) {
  if (styles.length === 0) {
    return <p className="text-sm text-muted-foreground">{dict.menuEmpty}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {styles.map((style) => {
        const isSelected = style.style_id === selectedStyleId;
        const hasDetails = style.variations.length > 0 || style.addons.length > 0;

        return (
          <div
            key={style.style_id}
            className={`overflow-hidden rounded-2xl border transition-colors ${
              isSelected ? "border-foreground" : "border-border/70"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectStyle(style.style_id)}
              aria-pressed={isSelected}
              className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left sm:px-5"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold text-foreground">{style.name}</span>
                {style.duration_minutes != null && (
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(style.duration_minutes, dict)}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {formatTemplate(dict.fromPrice, {
                    price: formatPrice(style.base_price),
                  })}
                </span>
                <span
                  aria-hidden
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border"
                  }`}
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </span>
            </button>

            {isSelected && hasDetails && (
              <div className="flex flex-col gap-4 border-t border-border/70 px-4 py-4 sm:px-5">
                {style.variations.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {dict.variationsLabel}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {style.variations.map((variation) => {
                        const isChosen = variation.id === selectedVariationId;
                        return (
                          <button
                            key={variation.id}
                            type="button"
                            onClick={() =>
                              onSelectVariation(isChosen ? null : variation.id)
                            }
                            aria-pressed={isChosen}
                            className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                              isChosen
                                ? "border-foreground bg-foreground text-background"
                                : "border-border text-foreground hover:bg-border/40"
                            }`}
                          >
                            {variation.name} · €{formatPrice(variation.price)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {style.addons.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {dict.addonsLabel}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {style.addons.map((addon) => {
                        const checked =
                          addon.is_required || selectedAddonIds.has(addon.id);
                        return (
                          <label
                            key={addon.id}
                            className={`flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3.5 py-2.5 text-sm ${
                              addon.is_required
                                ? "opacity-80"
                                : "cursor-pointer hover:bg-border/30"
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={addon.is_required}
                                onChange={() => onToggleAddon(addon.id)}
                                className="size-4 accent-brand"
                              />
                              <span className="text-foreground">{addon.name}</span>
                              {addon.is_required && (
                                <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                  {dict.requiredBadge}
                                </span>
                              )}
                            </span>
                            <span className="font-medium text-foreground">
                              +€{formatPrice(addon.price)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
