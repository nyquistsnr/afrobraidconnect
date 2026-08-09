import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { LanguageSwitcher } from "@/components/language/language-switcher";

export function SiteFooter({
  lang,
  dict,
  common,
}: {
  lang: Locale;
  dict: Dictionary["common"]["footer"];
  common?: Dictionary["common"];
}) {
  return (
    <footer className="bg-how-it-works text-how-it-works-foreground mt-auto">
      <div className="mx-auto flex max-w-[1760px] flex-col lg:flex-row justify-between gap-16 px-6 py-16 lg:px-10 lg:py-24">
        {/* Logo Section */}
        <div className="flex flex-col gap-6 lg:w-1/4">
          <Link href={`/${lang}`} aria-label="Afrobraids Connect Home">
            <Image
              src="/logo/logo.webp"
              alt="Afrobraids Connect"
              width={200}
              height={51}
              className="h-8 w-auto brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 lg:w-3/4 w-full">
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">{dict.legal}</h3>
            <Link href={`/${lang}/privacy`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.privacyPolicy}</Link>
            <Link href={`/${lang}/terms`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.termsOfService}</Link>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">{dict.forBusiness}</h3>
            <Link href={`/${lang}/partners`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.forPartners}</Link>
            <Link href={`/${lang}/pricing`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.pricing}</Link>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">{dict.company}</h3>
            <Link href={`/${lang}/esther-ai`} className="text-sm text-brand font-semibold hover:text-brand/80 transition-colors flex items-center gap-1.5">
              <Sparkles className="size-4 shrink-0" />
              Esther AI
            </Link>
            <Link href={`/${lang}/about`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.about}</Link>
            <Link href={`/${lang}/contact`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.contact}</Link>
            <Link href={`/${lang}/blog`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.blog}</Link>
            <Link href={`/${lang}/sitemap`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.sitemap}</Link>
            <Link href={`/${lang}/#how-it-works`} className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors">{dict.howItWorks}</Link>
          </div>
          
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-white">{dict.connectWithUs}</h3>
            <Link href="#" className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowUpRight className="size-4 shrink-0" />
              {dict.facebook}
            </Link>
            <Link href="#" className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowUpRight className="size-4 shrink-0" />
              {dict.twitter}
            </Link>
            <Link href="#" className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowUpRight className="size-4 shrink-0" />
              {dict.linkedin}
            </Link>
            <Link href="#" className="text-sm text-how-it-works-muted-foreground hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowUpRight className="size-4 shrink-0" />
              {dict.instagram}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1760px] flex-col items-center justify-between gap-6 px-6 py-8 md:flex-row lg:px-10">
          <div 
            className="flex items-center"
            style={{ 
              '--muted-foreground': 'var(--how-it-works-muted-foreground)', 
              '--foreground': 'var(--how-it-works-foreground)',
              '--border': 'var(--how-it-works-muted-foreground)'
            } as React.CSSProperties}
          >
            {common && <LanguageSwitcher lang={lang} dict={common.language} closeLabel={common.close} />}
          </div>
          <p className="text-xs text-how-it-works-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} Afro-Connect. {dict.rightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
