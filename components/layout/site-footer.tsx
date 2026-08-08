import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export function SiteFooter({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["common"]["footer"];
}) {
  return (
    <footer className="border-t border-border bg-background py-8 md:py-12 mt-auto">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row lg:px-12">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Afrobraids Connect
          </span>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Afrobraids Connect. {dict.rightsReserved}
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground md:justify-end">
          <Link
            href={`/${lang}/privacy`}
            className="transition-colors hover:text-brand"
          >
            {dict.privacyPolicy}
          </Link>
          <Link
            href={`/${lang}/terms`}
            className="transition-colors hover:text-brand"
          >
            {dict.termsOfService}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
