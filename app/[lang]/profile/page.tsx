import { notFound, redirect } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import type { Locale } from "@/lib/i18n";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { auth } from "@/auth";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.accessToken) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/profile`);
  }

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        common={dict.common}
        notificationsDict={dict.notifications}
      />
      <main className="flex-1 px-4 pt-8 pb-32 md:pb-8 sm:px-6 lg:px-10 max-w-3xl mx-auto w-full">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
          {dict.profile.title}
        </h1>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <ProfileForm 
            dict={dict.profile} 
            lang={lang}
            accessToken={session.accessToken}
          />
        </div>
      </main>
    </div>
  );
}
