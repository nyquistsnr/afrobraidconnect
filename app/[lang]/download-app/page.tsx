import type { Metadata } from "next";
import { getDictionary, hasLocale } from "@/app/[lang]/dictionaries";
import { DownloadAppView } from "@/components/download/download-app-view";
import type { Locale } from "@/lib/i18n";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  
  const dict = await getDictionary(lang);
  return {
    title: `${dict.downloadApp.title} - Afrobraids Connect`,
    description: dict.downloadApp.description,
  };
}

export default async function DownloadAppPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  
  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        common={dict.common}
        notificationsDict={dict.notifications}
      />
      
      <main className="flex-1">
        <DownloadAppView
          lang={lang}
          dict={dict.downloadApp}
        />
      </main>

      <SiteFooter lang={lang} dict={dict.common.footer} common={dict.common} />
    </div>
  );
}
