import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
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
  const { email, callbackUrl } = await searchParams;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const defaultEmail = typeof email === "string" ? email : "";
  const safeCallbackUrl = sanitizeCallbackUrl(
    typeof callbackUrl === "string" ? callbackUrl : null
  );

  return (
    <AuthShell lang={lang} common={dict.common}>
      <VerifyEmailForm
        dict={dict.verifyEmail}
        common={dict.common}
        lang={lang}
        defaultEmail={defaultEmail}
        callbackUrl={safeCallbackUrl}
      />
    </AuthShell>
  );
}
