"use client";

import { useLayoutEffect } from "react";
import type { Locale } from "@/lib/i18n";

// The <html> tag lives in the static root layout (app/layout.tsx), which
// has no access to the [lang] route param. This syncs it after mount/on
// locale change instead — useLayoutEffect so it lands before paint.
export function HtmlLangSync({ lang }: { lang: Locale }) {
  useLayoutEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}
