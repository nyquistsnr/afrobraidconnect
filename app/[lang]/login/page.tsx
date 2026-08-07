import { notFound } from "next/navigation";
import { getDictionary, hasLocale, locales } from "../dictionaries";
import { sanitizeCallbackUrl } from "@/lib/callback-url";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login/login-form";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  const { callbackUrl } = await searchParams;

  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang);
  const safeCallbackUrl = sanitizeCallbackUrl(
    typeof callbackUrl === "string" ? callbackUrl : null
  );

  return (
    <AuthShell
      lang={lang}
      supportEmail={dict.common.supportEmail}
      heroImageAlt={dict.common.heroImageAlt}
      themeLabels={dict.common.theme}
    >
      <LoginForm
        dict={dict.login}
        common={dict.common}
        lang={lang}
        callbackUrl={safeCallbackUrl}
      />
    </AuthShell>
  );
}
