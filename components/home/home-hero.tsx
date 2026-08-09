"use client";

import { Search } from "lucide-react";
import { AppointmentsCounter } from "@/components/home/appointments-counter";
import { HeroStyleGallery } from "@/components/home/hero-style-gallery";
import type { Locale } from "@/lib/i18n";

export interface HomeHeroDict {
  title: string;
  subtitle: string;
  startSearch: string;
  styleGalleryAlt: string;
  appointmentsBooked: string;
}

// The title/subtitle run on every breakpoint; the search-trigger button
// stays desktop/tablet only (hidden below md) since mobile keeps its
// existing header MobileSearch sheet flow for search. The style gallery and
// appointments counter below it, and the bg-hero band wrapping the whole
// section, also run on every breakpoint.
export function HomeHero({
  dict,
  docked,
  onActivate,
  lang,
}: {
  dict: HomeHeroDict;
  docked: boolean;
  onActivate: () => void;
  lang: Locale;
}) {
  return (
    <section className="flex flex-col items-center gap-8 bg-hero px-6 pt-6 pb-10 text-center md:gap-9 md:pt-10 md:pb-16 lg:pt-14 lg:pb-24">
      <div className="flex max-w-2xl flex-col gap-3 md:gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          {dict.title}
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base lg:text-lg">
          {dict.subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onActivate}
        inert={docked}
        className={`hero-search-trigger hidden h-14 items-center gap-3 rounded-full border border-border bg-surface px-5 shadow-sm transition-shadow hover:shadow-md md:flex ${
          docked ? "hero-search-trigger-hidden" : ""
        }`}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
          <Search className="size-4" />
        </span>
        <span className="text-sm font-medium text-foreground">
          {dict.startSearch}
        </span>
      </button>

      <HeroStyleGallery alt={dict.styleGalleryAlt} />

      <AppointmentsCounter template={dict.appointmentsBooked} lang={lang} />
    </section>
  );
}
