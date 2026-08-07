import { notFound } from "next/navigation";
import { hasLocale, locales } from "./dictionaries";
import { HtmlLangSync } from "@/components/html-lang-sync";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  return (
    <>
      <HtmlLangSync lang={lang} />
      {children}
    </>
  );
}
