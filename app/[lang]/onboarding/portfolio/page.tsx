import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale, locales } from "../../dictionaries";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { loginPath } from "@/lib/auth-redirect";
import { PortfolioForm } from "@/components/onboarding/portfolio-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function PortfolioPage({
  params,
}: PageProps<"/[lang]/onboarding/portfolio">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session) redirect(await loginPath(lang));

  const dict = await getDictionary(lang);

  const portfolio = await onboardingApi
    .getPortfolio(session.accessToken)
    .catch(async () => redirect(await loginPath(lang)));

  return (
    <PortfolioForm
      dict={dict.onboarding.portfolio}
      common={dict.common}
      lang={lang}
      initialData={portfolio}
    />
  );
}
