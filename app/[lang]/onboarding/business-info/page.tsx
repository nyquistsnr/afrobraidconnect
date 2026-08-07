import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale, locales } from "../../dictionaries";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { loginPath } from "@/lib/auth-redirect";
import { BusinessInfoForm } from "@/components/onboarding/business-info-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function BusinessInfoPage({
  params,
}: PageProps<"/[lang]/onboarding/business-info">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  // onboarding/layout.tsx redirects when unauthenticated too, but Next
  // renders a layout and its page concurrently rather than strictly in
  // order, so this page's own code still runs and needs its own guard.
  const session = await auth();
  if (!session) redirect(await loginPath(lang));

  const dict = await getDictionary(lang);

  const businessInfo = await onboardingApi
    .getBusinessInfo(session.accessToken)
    .catch(async () => redirect(await loginPath(lang)));

  return (
    <BusinessInfoForm
      dict={dict.onboarding.businessInfo}
      common={dict.common}
      lang={lang}
      initialData={businessInfo}
    />
  );
}
