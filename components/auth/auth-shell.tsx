import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { LanguageSwitcher } from "@/components/language/language-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AuthShell({
  lang,
  common,
  children,
}: {
  lang: Locale;
  common: Dictionary["common"];
  children: React.ReactNode;
}) {
  const { supportEmail, heroImageAlt } = common;
  return (
    <div className="flex min-h-screen flex-1 bg-background">
      <div className="flex w-full flex-col justify-between px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm pb-8 pt-4">
          <Link href={`/${lang}`} className="inline-block">
            <Image
              src="/logo/logo.webp"
              alt="Afrobraids Connect"
              width={256}
              height={65}
              priority
              className="theme-invert h-8 w-auto sm:h-10"
            />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">{children}</div>

        <div className="mx-auto flex w-full max-w-sm flex-col-reverse items-center gap-4 pt-10 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <a
            href={`mailto:${supportEmail}`}
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <Mail className="size-4" />
            {supportEmail}
          </a>
          <div className="flex items-center gap-3">
            <ThemeToggle dict={common.theme} closeLabel={common.close} />
            <LanguageSwitcher
              lang={lang}
              dict={common.language}
              closeLabel={common.close}
            />
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2">
        <img
          src="/images/hero_hero.png"
          alt={heroImageAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
