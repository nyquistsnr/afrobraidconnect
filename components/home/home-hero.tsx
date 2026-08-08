"use client";

import { Search } from "lucide-react";

export interface HomeHeroDict {
  title: string;
  subtitle: string;
  startSearch: string;
}

// Desktop/tablet only (hidden below md) — mobile keeps its existing empty
// hero + MobileSearch sheet flow, untouched by this.
export function HomeHero({
  dict,
  docked,
  onActivate,
}: {
  dict: HomeHeroDict;
  docked: boolean;
  onActivate: () => void;
}) {
  return (
    <section className="hidden flex-col items-center gap-7 px-6 pt-10 pb-16 text-center md:flex lg:pt-14 lg:pb-24">
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
          {dict.title}
        </h1>
        <p className="mx-auto max-w-xl text-base text-muted-foreground lg:text-lg">
          {dict.subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onActivate}
        inert={docked}
        className={`hero-search-trigger flex h-14 items-center gap-3 rounded-full border border-border bg-surface px-5 shadow-sm transition-shadow hover:shadow-md ${
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
    </section>
  );
}
