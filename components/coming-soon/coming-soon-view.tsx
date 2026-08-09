"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowLeft, Search } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export function ComingSoonView({
  lang,
  dict,
  pageName,
}: {
  lang: Locale;
  dict: Dictionary["comingSoonPage"];
  pageName: "partners" | "pricing";
}) {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-background px-6 py-24">
      {/* Abstract Background Elements */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30 blur-[100px]">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="h-[40vw] w-[40vw] rounded-full bg-brand/30"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute h-[30vw] w-[30vw] rounded-full bg-blue-500/20"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex max-w-xl flex-col items-center text-center"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20">
          <Sparkles className="size-8" />
        </div>

        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {dict.title}
        </h1>
        
        <p className="mb-10 text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {dict.subtitle}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row w-full sm:w-auto">
          <Link
            href={`/${lang}`}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <ArrowLeft className="size-4" />
            {dict.backToHome}
          </Link>
          <Link
            href={`/${lang}/search`}
            className="flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <Search className="size-4" />
            {dict.exploreBraiders}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
