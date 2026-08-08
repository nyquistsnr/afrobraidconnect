import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default async function Home({ params }: PageProps<"/[lang]">) {
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
      />
      <main className="flex-1 pb-16 md:pb-0" />
      <SiteFooter lang={lang} dict={dict.common.footer} />
    </div>
  );
}
