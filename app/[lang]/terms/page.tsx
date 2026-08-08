import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { LegalPage } from "@/components/legal/legal-page";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function TermsPage({
  params,
}: PageProps<"/[lang]/terms">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        common={dict.common}
        notificationsDict={dict.notifications}
        chatNavAriaLabel={dict.chatInbox.navAriaLabel}
      />
      <main className="flex-1">
        <LegalPage
          title={dict.terms.title}
          lastUpdated={dict.terms.lastUpdated}
          sections={dict.terms.sections}
        />
      </main>
      <SiteFooter lang={lang} dict={dict.common.footer} />
    </div>
  );
}
