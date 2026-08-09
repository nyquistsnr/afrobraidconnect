import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export interface HowItWorksStepDict {
  imageAlt: string;
  title: string;
  description: string;
}

export interface HowItWorksDict {
  badge: string;
  title: string;
  cta: string;
  steps: HowItWorksStepDict[];
}

const STEP_IMAGES = [
  "/images/home_how_it_works/person6.webp",
  "/images/home_how_it_works/person12.webp",
  "/images/home_how_it_works/person19.webp",
];

export function HowItWorks({
  dict,
  lang,
}: {
  dict: HowItWorksDict;
  lang: Locale;
}) {
  return (
    <section className="bg-how-it-works px-6 py-14 text-center md:py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 md:gap-10">
        <span className="rounded-full bg-how-it-works-foreground px-5 py-2 text-sm font-semibold text-how-it-works">
          {dict.badge}
        </span>

        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-how-it-works-foreground sm:text-4xl">
          {dict.title}
        </h2>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {dict.steps.map((step, index) => (
            <div
              key={step.title}
              className="flex flex-col overflow-hidden rounded-2xl bg-surface text-left shadow-sm"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={STEP_IMAGES[index]}
                  alt={step.imageAlt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 px-5 py-5">
                <h3 className="text-lg font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href={`/${lang}/search`}
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
        >
          {dict.cta}
        </Link>
      </div>
    </section>
  );
}
