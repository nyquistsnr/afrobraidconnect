"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { useScrolled } from "@/lib/use-scrolled";
import { SiteHeader, type SiteHeaderDict } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero, type HomeHeroDict } from "@/components/home/home-hero";
import { HowItWorks, type HowItWorksDict } from "@/components/home/how-it-works";
import { GrowBusiness, type GrowBusinessDict } from "@/components/home/grow-business";
import {
  TestimonialsCarousel,
  type TestimonialsDict,
} from "@/components/home/testimonials-carousel";
import { Faqs, type FaqsDict } from "@/components/home/faqs";
import { FinalCta, type FinalCtaDict } from "@/components/home/final-cta";
import type { NotificationBellDict } from "@/components/notifications/types";

// Owns the hero<->header search "docked" signal so the header (rendered
// first) and the hero trigger (rendered inside <main>, a sibling) can share
// it without a page-local Context — matches how the rest of the app favors
// explicit props over Context for anything that isn't truly app-wide.
export function HomePageShell({
  lang,
  siteHeaderDict,
  common,
  notificationsDict,
  heroDict,
  howItWorksDict,
  growBusinessDict,
  testimonialsDict,
  faqsDict,
  finalCtaDict,
  footerDict,
}: {
  lang: Locale;
  siteHeaderDict: SiteHeaderDict;
  common: Dictionary["common"];
  notificationsDict: NotificationBellDict;
  heroDict: HomeHeroDict;
  howItWorksDict: HowItWorksDict;
  growBusinessDict: GrowBusinessDict;
  testimonialsDict: TestimonialsDict;
  faqsDict: FaqsDict;
  finalCtaDict: FinalCtaDict;
  footerDict: Dictionary["common"]["footer"];
}) {
  const scrolled = useScrolled();
  const [panelOpen, setPanelOpen] = useState(false);
  const [activateSignal, setActivateSignal] = useState(0);
  const docked = scrolled || panelOpen;

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <SiteHeader
        lang={lang}
        dict={siteHeaderDict}
        common={common}
        notificationsDict={notificationsDict}
        searchDocked={docked}
        onSearchActiveChange={setPanelOpen}
        searchActivateSignal={activateSignal}
      />
      <main className="flex-1">
        <HomeHero
          dict={heroDict}
          docked={docked}
          onActivate={() => setActivateSignal((n) => n + 1)}
          lang={lang}
        />
        <HowItWorks dict={howItWorksDict} lang={lang} />
        <GrowBusiness dict={growBusinessDict} />
        <TestimonialsCarousel dict={testimonialsDict} />
        <Faqs dict={faqsDict} />
        <FinalCta dict={finalCtaDict} lang={lang} />
      </main>
      <SiteFooter lang={lang} dict={footerDict} common={common} />
    </div>
  );
}
