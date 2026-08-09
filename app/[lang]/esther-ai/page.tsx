import { notFound, redirect } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import type { Locale } from "@/lib/i18n";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { auth } from "@/auth";
import { catalogApi } from "@/lib/api/catalog-client";
import { EstherAiShell } from "@/components/esther-ai/esther-ai-shell";
import type { StylePublicResponse } from "@/lib/api/types";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function EstherAiPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.accessToken) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/esther-ai`);
  }

  const dict = await getDictionary(lang);
  
  // Fetch the first page of styles to act as the base catalog for the selector
  // We can fetch more client-side if needed, but this gives a fast initial render.
  let styles: StylePublicResponse[] = [];
  try {
    const styleData = await catalogApi.getStyles({ pageSize: 50 }, lang);
    styles = styleData.items;
  } catch (error) {
    console.error("Failed to fetch styles for Esther AI", error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        common={dict.common}
        notificationsDict={dict.notifications}
      />
      
      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {dict.estherAi.pageTitle}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {dict.estherAi.ctaDescription}
          </p>
        </div>
        
        <EstherAiShell 
          dict={dict.estherAi} 
          lang={lang}
          accessToken={session.accessToken}
          styles={styles}
        />
      </main>
      
      <SiteFooter lang={lang} dict={dict.common.footer} common={dict.common} />
    </div>
  );
}
