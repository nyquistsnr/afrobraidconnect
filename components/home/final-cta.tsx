import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export interface FinalCtaDict {
  imageAlt: string;
  title: string;
  findBraiderCta: string;
  joinBraiderCta: string;
}

const BACKGROUND_IMAGE = "/images/hero.png";

export function FinalCta({ dict, lang }: { dict: FinalCtaDict; lang: Locale }) {
  return (
    <section className="relative isolate flex min-h-[24rem] sm:min-h-[28rem] md:min-h-[32rem] lg:min-h-[40rem] xl:min-h-[48rem] 2xl:min-h-[56rem] items-center justify-center overflow-hidden py-14 md:py-20 px-6">
      <Image
        src={BACKGROUND_IMAGE}
        alt={dict.imageAlt}
        fill
        sizes="100vw"
        className="object-cover object-[center_30%]"
        priority={false}
      />
      {/* A subtle uniform overlay to ensure text readability without making the image too dark */}
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative flex flex-col items-center justify-center gap-8 md:gap-10 max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl leading-tight">
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
            href="#"
            className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand shadow-sm transition-colors hover:bg-white/90"
          >
            {dict.joinBraiderCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
