import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password/reset-password-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: PageProps<"/[lang]/reset-password">) {
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
      <ResetPasswordForm
        dict={dict.resetPassword}
        common={dict.common}
        lang={lang}
        defaultEmail={defaultEmail}
      />
    </AuthShell>
  );
}
