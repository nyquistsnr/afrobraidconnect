export const locales = ["en", "fr", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  de: "Deutsch",
};

// Country used to represent each language's flag, and as the default
// country for the phone number input.
export const localeCountry: Record<Locale, "GB" | "FR" | "DE"> = {
  en: "GB",
  fr: "FR",
  de: "DE",
};

export const hasLocale = (locale: string): locale is Locale =>
  (locales as readonly string[]).includes(locale);
