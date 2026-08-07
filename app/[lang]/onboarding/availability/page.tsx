import { redirect } from "next/navigation";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { Locale } from "@/lib/i18n";
import { auth } from "@/auth";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { AvailabilityForm } from "@/components/onboarding/availability-form";

export default async function AvailabilityPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const dict = await getDictionary(lang);
  const session = await auth();

  if (!session?.accessToken) {
    redirect(`/${lang}/login`);
  }

  // Fetch all required data for the availability form concurrently
  const [settings, windows, exceptions] = await Promise.all([
    onboardingApi.getAvailabilitySettings(session.accessToken),
    onboardingApi.getWeeklyWindows(session.accessToken),
    onboardingApi.getExceptions(session.accessToken),
  ]).catch((error) => {
    // If settings haven't been created yet, they are auto-created, so this shouldn't 404,
    // but we can catch general API errors and redirect/throw.
    console.error("Failed to fetch availability data:", error);
    throw error;
  });

  return (
    <AvailabilityForm
      dict={dict.onboarding.availability}
      common={dict.common}
      lang={lang}
      initialSettings={settings}
      initialWindows={windows}
      initialExceptions={exceptions}
    />
  );
}
