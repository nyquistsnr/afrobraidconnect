import Image from "next/image";
import Link from "next/link";
import { EstherAiCta } from "@/components/esther-ai/esther-ai-cta";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export interface FinalCtaDict {
  imageAlt: string;
  title: string;
  findBraiderCta: string;
  joinBraiderCta: string;
}

const braiderAppUrl = process.env.NEXT_PUBLIC_BRAIDER_APP_URL || "https://braider.afrobraid.com";

const BACKGROUND_IMAGE = "/images/hero.png";

export function FinalCta({ 
  dict, 
  estherAiDict,
  lang 
}: { 
  dict: FinalCtaDict; 
  estherAiDict: Dictionary["estherAi"];
  lang: Locale;
}) {
  const braiderSignupUrl = `${braiderAppUrl}/${lang}/signup`;

  return (
    <section className="relative isolate flex min-h-[32rem] sm:min-h-[36rem] md:min-h-[40rem] lg:min-h-[44rem] xl:min-h-[52rem] 2xl:min-h-[60rem] items-center justify-center overflow-hidden py-14 md:py-20 px-6">
      <Image
        src={BACKGROUND_IMAGE}
        alt={dict.imageAlt}
        fill
        sizes="100vw"
        className="object-cover object-[center_30%]"
        priority={false}
        unoptimized
      />
      {/* A subtle uniform overlay to ensure text readability without making the image too dark */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative flex flex-col items-center justify-center gap-8 md:gap-10 w-full max-w-4xl text-center z-10">
        <EstherAiCta dict={estherAiDict} lang={lang} />
        
        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl leading-tight mt-4">
          {dict.title}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/${lang}/search`}
            className="rounded-full bg-brand/95 px-7 py-3.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-brand"
          >
            {dict.findBraiderCta}
          </Link>
          <Link
            href={braiderSignupUrl}
            className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-white/90"
          >
            {dict.joinBraiderCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
