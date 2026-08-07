import { notFound, redirect } from "next/navigation";
import { hasLocale, locales } from "../../../dictionaries";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Landing page for Veriff's hosted-flow redirect (VERIFF_CALLBACK_URL on the
// backend should point here). The id-verification page already renders the
// right state — pending/approved/failed — from a fresh status fetch, so
// there's nothing return-leg-specific to show; just hand off to it.
export default async function VeriffCompletePage({
  params,
}: PageProps<"/[lang]/onboarding/id-verification/complete">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  redirect(`/${lang}/onboarding/id-verification`);
}
