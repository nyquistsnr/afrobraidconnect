import { redirect } from "next/navigation";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { auth } from "@/auth";
import { usersApi } from "@/lib/api/users-client";
import { ProfileForm } from "@/components/dashboard/profile-form";
import type { Locale } from "@/lib/i18n";

export default async function ProfilePage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const session = await auth();

  if (!session?.accessToken || session.error === "RefreshAccessTokenError") {
    redirect(`/${lang}/login`);
  }

  const dict = await getDictionary(lang);
  const user = await usersApi.getMe(session.accessToken);

  return (
    <div className="mx-auto max-w-2xl pt-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {dict.dashboard.profile.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.dashboard.profile.subtitle}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <ProfileForm
          user={user}
          logoUrl={session.braider?.logo_url ?? null}
          dict={dict.dashboard.profile}
          common={dict.common}
          accessToken={session.accessToken}
          lang={lang}
        />
      </div>
    </div>
  );
}
