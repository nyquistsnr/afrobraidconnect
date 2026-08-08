import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/forgot-password/forgot-password-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[lang]/forgot-password">) {
  const { lang } = await params;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);

  return (
    <AuthShell lang={lang} common={dict.common}>
      <ForgotPasswordForm
        dict={dict.forgotPassword}
        common={dict.common}
        lang={lang}
      />
    </AuthShell>
  );
}
