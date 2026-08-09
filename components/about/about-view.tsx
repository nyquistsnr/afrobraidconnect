"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { MapPin, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export function AboutView({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["aboutUs"];
}) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="/about_us_hero.jpg"
            alt="Afrobraids Connect Abstract Art"
            fill
            className="object-cover opacity-90 object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center lg:px-10"
        >
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <Sparkles className="size-4 text-brand" />
            <span className="text-sm font-medium tracking-wide text-white/90">
              {dict.title}
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            {dict.heroHeadline}
          </motion.h1>
          
          <motion.p variants={itemVariants} className="max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
            {dict.heroSubtitle}
          </motion.p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="relative z-20 -mt-10 mx-auto w-full max-w-[1760px] px-4 sm:px-6 lg:px-10">
        <div className="rounded-3xl border border-border bg-surface/80 p-8 shadow-2xl backdrop-blur-xl sm:p-12 lg:p-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl">
              {dict.missionTitle}
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {dict.missionText}
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="mx-auto w-full max-w-[1760px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {dict.whyChooseUsTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-12">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <MapPin className="size-8" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-foreground">
              {dict.whyLocation}
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {dict.whyLocationText}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500">
              <ShieldCheck className="size-8" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-foreground">
              {dict.whyPortfolios}
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {dict.whyPortfoliosText}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Sparkles className="size-8" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-foreground">
              {dict.whyEstherAI}
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {dict.whyEstherAIText}
            </p>
          </div>
        </div>
      </section>

      {/* Esther AI Highlight Section */}
      <section className="bg-foreground py-24 text-background">
        <div className="mx-auto flex w-full max-w-[1760px] flex-col items-center gap-12 px-4 sm:px-6 lg:flex-row lg:px-10">
          <div className="flex-1 lg:pr-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-1.5">
              <Sparkles className="size-4 text-brand" />
              <span className="text-sm font-medium tracking-wide">
                Powered by AI
              </span>
            </div>
            <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Meet Esther AI
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-background/80">
              {dict.whyEstherAIText} It's like having a personal hair consultant available 24/7.
            </p>
            <Link
              href={`/${lang}/esther-ai`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-hover font-semibold transition-colors"
            >
              Try Esther AI <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="flex-1 w-full relative">
             <div className="aspect-[4/3] w-full rounded-3xl overflow-hidden relative shadow-2xl border border-background/10 bg-background/5">
                {/* Abstract visualization of Esther AI */}
                <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 via-background/5 to-blue-500/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="relative h-32 w-32">
                     <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-brand/30 border-t-brand border-b-brand"
                     />
                     <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-4 rounded-full border border-blue-500/30 border-l-blue-500 border-r-blue-500"
                     />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="size-8 text-brand" />
                     </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-32 text-center">
        <div className="absolute inset-0 z-0 bg-brand/5" />
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <h2 className="mb-8 text-4xl font-bold text-foreground sm:text-5xl">
            {dict.ctaTitle}
          </h2>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${lang}/search`}
              className="flex w-full items-center justify-center rounded-full bg-brand px-8 py-4 text-base font-semibold text-brand-foreground shadow-lg transition-colors hover:bg-brand-hover sm:w-auto focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              {dict.ctaButton}
            </Link>
            <Link
              href={`/${lang}/partners`}
              className="flex w-full items-center justify-center rounded-full border border-border bg-background px-8 py-4 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-surface sm:w-auto focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
            >
              {dict.ctaPartner}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
