"use client";

import { useState, useEffect } from "react";
import { hasLocale, defaultLocale, type Locale } from "@/lib/i18n";
import { NotFoundContent } from "@/components/errors/not-found-content";
import enDict from "@/app/[lang]/dictionaries/en.json";
import deDict from "@/app/[lang]/dictionaries/de.json";
import frDict from "@/app/[lang]/dictionaries/fr.json";

const DICTS: Record<Locale, { notFoundPage: (typeof enDict)["notFoundPage"] }> = {
  en: enDict,
  de: deDict,
  fr: frDict,
};

function localeFromPathname(pathname: string): Locale {
  const firstSegment = pathname.split("/")[1];
  return firstSegment && hasLocale(firstSegment) ? firstSegment : defaultLocale;
}

// Next.js routes unmatched URLs straight to the root not-found boundary
// (bypassing nested [lang]/not-found.tsx entirely), so route params and
// usePathname() aren't reliable here — the locale is read straight from
// window.location once mounted instead.
export default function LocalizedNotFound() {
  const [lang, setLang] = useState<Locale>(defaultLocale);

  useEffect(() => {
    setLang(localeFromPathname(window.location.pathname));
  }, []);

  return <NotFoundContent dict={DICTS[lang].notFoundPage} lang={lang} />;
}
