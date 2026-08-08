import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, locales, getDictionary } from "./dictionaries";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { SessionTimeoutModal } from "@/components/auth/session-timeout-modal";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <>
      <HtmlLangSync lang={lang} />
      {children}
      <Suspense>
        <SessionTimeoutModal lang={lang} dict={dict.common.sessionTimeout} />
      </Suspense>
    </>
  );
}
