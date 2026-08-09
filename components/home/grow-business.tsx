import Image from "next/image";
import Link from "next/link";

export interface GrowBusinessDict {
  title: string;
  subtitle: string;
  cta: string;
  testimonialImageAlt: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  dashboardImageAlt: string;
  dashboardCalloutTitle: string;
  dashboardCalloutSubtitle: string;
}

const PORTRAIT_IMAGE = "/images/home_grow_business/person21.webp";
const DASHBOARD_IMAGE = "/images/home_grow_business/person20.webp";

export function GrowBusiness({ dict }: { dict: GrowBusinessDict }) {
  return (
    <section className="bg-background px-6 py-14 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {dict.title}
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              {dict.subtitle}
            </p>
          </div>

          <Link
            href="#"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            {dict.cta}
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <div className="rounded-3xl bg-hero p-5 md:p-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl md:aspect-auto md:h-full md:min-h-[26rem]">
              <Image
                src={PORTRAIT_IMAGE}
                alt={dict.testimonialImageAlt}
                fill
                sizes="(min-width: 768px) 45vw, 90vw"
                className="object-cover"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-xl bg-black/55 px-4 py-3 backdrop-blur-sm sm:inset-x-6 sm:bottom-6">
                <p className="text-sm font-medium text-white sm:text-base">
                  &ldquo;{dict.testimonialQuote}&rdquo;
                </p>
                <p className="mt-1 text-xs text-white/70 sm:text-sm">
                  {dict.testimonialAuthor}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-3xl bg-hero p-5 md:p-6">
            <div className="relative aspect-[16/11] w-full">
              <Image
                src={DASHBOARD_IMAGE}
                alt={dict.dashboardImageAlt}
                fill
                sizes="(min-width: 768px) 45vw, 90vw"
                className="object-contain"
              />
            </div>
            <div className="flex min-h-[8rem] flex-1 flex-col justify-center gap-1 rounded-2xl bg-black/55 px-5 py-5 backdrop-blur-sm sm:px-6">
              <p className="text-sm font-medium text-white sm:text-base">
                {dict.dashboardCalloutTitle}
              </p>
              <p className="text-xs text-white/70 sm:text-sm">
                {dict.dashboardCalloutSubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
