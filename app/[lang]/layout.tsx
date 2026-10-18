import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, locales, getDictionary } from "./dictionaries";
import { HtmlLangSync } from "@/components/html-lang-sync";
import { NavigationProgress } from "@/components/navigation-progress";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
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
      <NavigationProgress />
      {children}
      <InstallAppPrompt dict={dict.installPrompt} />
      <Suspense>
        <SessionTimeoutModal lang={lang} dict={dict.common.sessionTimeout} />
      </Suspense>
    </>
  );
}
