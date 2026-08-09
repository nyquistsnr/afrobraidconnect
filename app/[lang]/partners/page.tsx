import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { SiteHeader } from "@/components/layout/site-header";
import { ComingSoonView } from "@/components/coming-soon/coming-soon-view";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function PartnersPage({
  params,
}: PageProps<"/[lang]/partners">) {
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
        <ComingSoonView lang={lang} dict={dict.comingSoonPage} pageName="partners" />
      </main>

      <SiteFooter lang={lang} dict={dict.common.footer} common={dict.common} />
    </div>
  );
}
