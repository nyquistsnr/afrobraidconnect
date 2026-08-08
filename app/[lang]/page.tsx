import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./dictionaries";
import { SiteHeader } from "@/components/layout/site-header";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        themeLabels={dict.common.theme}
      />
      <main className="flex-1" />
    </div>
  );
}
