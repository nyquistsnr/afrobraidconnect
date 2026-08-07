import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale, locales } from "../../dictionaries";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { loginPath } from "@/lib/auth-redirect";
import { VeriffForm } from "@/components/onboarding/veriff-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function IdVerificationPage({
  params,
}: PageProps<"/[lang]/onboarding/id-verification">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  // onboarding/layout.tsx redirects when unauthenticated too, but Next
  // renders a layout and its page concurrently rather than strictly in
  // order, so this page's own code still runs and needs its own guard.
  const session = await auth();
  if (!session) redirect(await loginPath(lang));

  const dict = await getDictionary(lang);

  const veriffStatus = await onboardingApi
    .getVeriffStatus(session.accessToken)
    .catch(async () => redirect(await loginPath(lang)));

  return (
    <VeriffForm
      dict={dict.onboarding.veriff}
      common={dict.common}
      lang={lang}
      initialStatus={veriffStatus}
    />
  );
}
