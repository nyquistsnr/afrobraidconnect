import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/signup/signup-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function SignupPage({
  params,
  searchParams,
}: PageProps<"/[lang]/signup">) {
  const { lang } = await params;
  const { callbackUrl } = await searchParams;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const safeCallbackUrl = sanitizeCallbackUrl(
    typeof callbackUrl === "string" ? callbackUrl : null
  );

  return (
    <AuthShell lang={lang} common={dict.common}>
      <SignupForm dict={dict.signup} common={dict.common} lang={lang} callbackUrl={safeCallbackUrl} />
    </AuthShell>
  );
}
