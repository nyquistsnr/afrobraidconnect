import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { SiteHeader } from "@/components/layout/site-header";
import { SitemapView } from "@/components/sitemap/sitemap-view";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function SitemapPage({
  params,
}: PageProps<"/[lang]/sitemap">) {
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
        <SitemapView lang={lang} dict={dict.sitemap} />
      </main>

      <SiteFooter lang={lang} dict={dict.common.footer} common={dict.common} />
    </div>
  );
}
