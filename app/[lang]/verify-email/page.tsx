import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/verify-email/verify-email-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: PageProps<"/[lang]/verify-email">) {
  const { lang } = await params;
  const { email } = await searchParams;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const defaultEmail = typeof email === "string" ? email : "";

  return (
    <AuthShell
      lang={lang}
      supportEmail={dict.common.supportEmail}
      heroImageAlt={dict.common.heroImageAlt}
      themeLabels={dict.common.theme}
    >
      <VerifyEmailForm
        dict={dict.verifyEmail}
        common={dict.common}
        lang={lang}
        defaultEmail={defaultEmail}
      />
    </AuthShell>
  );
}
