import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale, locales } from "../../dictionaries";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { loginPath } from "@/lib/auth-redirect";
import { ServiceLocationForm } from "@/components/onboarding/service-location-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LocationPage({
  params,
}: PageProps<"/[lang]/onboarding/location">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session) redirect(await loginPath(lang));

  const dict = await getDictionary(lang);

  const location = await onboardingApi
    .getServiceLocation(session.accessToken)
    .catch(async () => redirect(await loginPath(lang)));

  return (
    <ServiceLocationForm
      dict={dict.onboarding.serviceLocation}
      common={dict.common}
      lang={lang}
      initialData={location}
    />
  );
}
