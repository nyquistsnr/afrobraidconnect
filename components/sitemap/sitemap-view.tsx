"use client";

import Link from "next/link";
import { Compass, Building2, Scale, LifeBuoy, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export function SitemapView({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["sitemap"];
}) {
  const sections = [
    {
      title: dict.explore,
      description: dict.exploreDesc,
      icon: Compass,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      links: [
        { label: dict.links.home, href: `/${lang}` },
        { label: dict.links.search, href: `/${lang}/search` },
      ],
    },
    {
      title: dict.company,
      description: dict.companyDesc,
      icon: Building2,
      color: "text-brand",
      bg: "bg-brand/10",
      links: [
        { label: dict.links.about, href: `/${lang}/about` },
        { label: dict.links.partners, href: `/${lang}/partners` },
        { label: dict.links.pricing, href: `/${lang}/pricing` },
        { label: dict.links.blog, href: `/${lang}/blog` },
      ],
    },
    {
      title: dict.support,
      description: dict.supportDesc,
      icon: LifeBuoy,
      color: "text-green-500",
      bg: "bg-green-500/10",
      links: [
        { label: dict.links.contact, href: `/${lang}/contact` },
      ],
    },
    {
      title: dict.legal,
      description: dict.legalDesc,
      icon: Scale,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      links: [
        { label: dict.links.privacy, href: `/${lang}/privacy` },
        { label: dict.links.terms, href: `/${lang}/terms` },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        {/* Header */}
        <section className="bg-surface px-6 py-20 text-center sm:py-32 lg:px-10">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {dict.title}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {dict.subtitle}
            </p>
          </div>
        </section>

        {/* Directory Grid */}
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {sections.map((section) => (
              <div
                key={section.title}
                className="flex flex-col rounded-3xl border border-border bg-surface p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${section.bg} ${section.color}`}>
                    <section.icon className="size-7" />
                  </div>
                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-foreground">
                      {section.title}
                    </h2>
                    <p className="text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
                    >
                      {link.label}
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
