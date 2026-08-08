"use client";

import { useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GB, FR, DE } from "country-flag-icons/react/3x2";
import { locales, localeNames, localeCountry, type Locale } from "@/lib/i18n";
import { OptionPickerModal } from "@/components/ui/option-picker-modal";

const flags: Record<Locale, typeof GB> = { en: GB, fr: FR, de: DE };

export interface LanguageDict {
  modalTitle: string;
  modalDescription?: string;
}

function LanguageSwitcherInner({
  lang,
  dict,
  closeLabel,
}: {
  lang: Locale;
  dict: LanguageDict;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTo(nextLang: Locale) {
    const segments = pathname.split("/");
    segments[1] = nextLang;
    const nextPath = segments.join("/") || "/";
    const query = searchParams.toString();
    router.replace(query ? `${nextPath}?${query}` : nextPath);
  }

  const CurrentFlag = flags[lang];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-muted-foreground hover:bg-border/40 hover:text-foreground"
      >
        <CurrentFlag title={localeCountry[lang]} className="h-3.5 w-5" />
        <span className="font-medium uppercase">{lang}</span>
      </button>

      <OptionPickerModal
        open={open}
        onClose={() => setOpen(false)}
        title={dict.modalTitle}
        description={dict.modalDescription}
        closeLabel={closeLabel}
        value={lang}
        onChange={switchTo}
        options={locales.map((locale) => {
          const Flag = flags[locale];
          return {
            value: locale,
            label: localeNames[locale],
            description: locale.toUpperCase(),
            leading: <Flag className="h-4 w-6 shrink-0" />,
          };
        })}
      />
    </>
  );
}

export function LanguageSwitcher(props: {
  lang: Locale;
  dict: LanguageDict;
  closeLabel: string;
}) {
  const CurrentFlag = flags[props.lang];
  return (
    <Suspense
      fallback={
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 rounded-full px-2 py-1 text-muted-foreground hover:bg-border/40 hover:text-foreground opacity-50"
        >
          <CurrentFlag title={localeCountry[props.lang]} className="h-3.5 w-5" />
          <span className="font-medium uppercase">{props.lang}</span>
        </button>
      }
    >
      <LanguageSwitcherInner {...props} />
    </Suspense>
  );
}
