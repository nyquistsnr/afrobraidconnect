import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { stepSlugToStep } from "@/lib/onboarding";

// Placeholder for the onboarding steps that don't have a built screen yet
// (PORTFOLIO, SERVICE_LOCATION, AVAILABILITY, PAYMENT_SETUP) — business-info,
// phone-verification, id-verification, and service-type are wired up
// against the real API today. Auth/status guarding lives in
// onboarding/layout.tsx; this page only needs to validate the slug.
export default async function OnboardingStepPlaceholderPage({
  params,
}: PageProps<"/[lang]/onboarding/[step]">) {
  const { lang, step: stepSlug } = await params;

  if (!hasLocale(lang)) notFound();
  if (!stepSlugToStep(stepSlug)) notFound();

  const dict = await getDictionary(lang);

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">
        {dict.onboarding.comingSoon.title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {dict.onboarding.comingSoon.subtitle}
      </p>

      <Link
        href={`/${lang}/dashboard`}
        className="mt-8 inline-block font-medium text-brand hover:text-brand-hover"
      >
        {dict.common.backToDashboard}
      </Link>
    </div>
  );
}
