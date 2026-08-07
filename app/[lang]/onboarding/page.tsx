import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasLocale, locales } from "../dictionaries";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { loginPath } from "@/lib/auth-redirect";
import { onboardingStepPath } from "@/lib/onboarding";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Hub route: always recomputes current_step live (rather than trusting the
// possibly-stale session.braider snapshot from login) and forwards into the
// right wizard screen — mirrors the API doc's recommended routing function.
export default async function OnboardingHubPage({
  params,
}: PageProps<"/[lang]/onboarding">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session) redirect(await loginPath(lang));
  if (!session.braider) redirect(`/${lang}/dashboard`);

  const status = await onboardingApi
    .getStatus(session.accessToken)
    .catch(async () => redirect(await loginPath(lang)));

  redirect(onboardingStepPath(lang, status.current_step));
}
