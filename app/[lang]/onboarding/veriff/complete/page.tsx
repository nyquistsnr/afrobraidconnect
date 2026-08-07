import { notFound, redirect } from "next/navigation";
import { hasLocale, locales } from "../../../dictionaries";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Alias for the backend's VERIFF_CALLBACK_URL doc example
// (".../onboarding/veriff/complete") — our own step slug is
// "id-verification" (see STEP_SLUGS in lib/onboarding.ts), so this just
// hands off to the real route rather than requiring the backend env var to
// match our slug exactly.
export default async function VeriffCompleteAliasPage({
  params,
}: PageProps<"/[lang]/onboarding/veriff/complete">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  redirect(`/${lang}/onboarding/id-verification`);
}
