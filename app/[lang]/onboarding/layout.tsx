import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { loginPath } from "@/lib/auth-redirect";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// The single auth/status gate for every onboarding route, and the mount
// point for OnboardingShell — since it lives here rather than in each page,
// the header and stepper persist across step navigations instead of
// remounting on every click.
export default async function OnboardingLayout({
  children,
  params,
}: LayoutProps<"/[lang]/onboarding">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session || session.error === "RefreshAccessTokenError") {
    redirect(await loginPath(lang));
  }
  // Onboarding only applies to braider accounts.
  if (!session.braider) redirect(`/${lang}/dashboard`);

  const dict = await getDictionary(lang);
  const status = await onboardingApi
    .getStatus(session.accessToken)
    .catch(async () => redirect(await loginPath(lang)));

  if (status.current_step === "COMPLETED") redirect(`/${lang}/dashboard`);

  return (
    <OnboardingShell lang={lang} dict={dict} status={status}>
      {children}
    </OnboardingShell>
  );
}
