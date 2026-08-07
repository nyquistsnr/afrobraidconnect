"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { GB, FR, DE } from "country-flag-icons/react/3x2";
import { locales, localeNames, localeCountry, type Locale } from "@/lib/i18n";

const flags: Record<Locale, typeof GB> = { en: GB, fr: FR, de: DE };

export function LanguageSwitcher({
  lang,
  dropDirection = "up",
}: {
  lang: Locale;
  dropDirection?: "up" | "down";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchTo(nextLang: Locale) {
    setOpen(false);
    const segments = pathname.split("/");
    segments[1] = nextLang;
    router.push(segments.join("/") || "/");
  }

  const CurrentFlag = flags[lang];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2 py-1 text-muted-foreground hover:bg-border/40 hover:text-foreground"
      >
        <CurrentFlag title={localeCountry[lang]} className="h-3.5 w-5" />
        <span className="font-medium uppercase">{lang}</span>
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute right-0 w-40 overflow-hidden border border-border bg-surface py-1 shadow-lg ${
            dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {locales.map((locale) => {
            const Flag = flags[locale];
            return (
              <li key={locale}>
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === lang}
                  onClick={() => switchTo(locale)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-border/40 ${
                    locale === lang
                      ? "font-semibold text-brand"
                      : "text-foreground"
                  }`}
                >
                  <Flag className="h-3.5 w-5 shrink-0" />
                  {localeNames[locale]}
                  <span className="ml-auto text-xs uppercase text-muted-foreground">
                    {locale}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
