import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale, locales } from "../../dictionaries";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { loginPath } from "@/lib/auth-redirect";
import { ServiceTypeForm } from "@/components/onboarding/service-type-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function ServiceTypePage({
  params,
}: PageProps<"/[lang]/onboarding/service-type">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  // onboarding/layout.tsx redirects when unauthenticated too, but Next
  // renders a layout and its page concurrently rather than strictly in
  // order, so this page's own code still runs and needs its own guard.
  const session = await auth();
  if (!session) redirect(await loginPath(lang));

  const dict = await getDictionary(lang);

  const services = await onboardingApi
    .getServices(session.accessToken)
    .catch(async () => redirect(await loginPath(lang)));

  return (
    <ServiceTypeForm
      dict={dict.onboarding.serviceType}
      common={dict.common}
      lang={lang}
      initialServices={services.items}
    />
  );
}
