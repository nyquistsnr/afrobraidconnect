"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Home, Search } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export interface NotFoundDict {
  eyebrow: string;
  title: string;
  subtitle: string;
  homeCta: string;
  searchCta: string;
}

const DIGITS = ["4", "0", "4"];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0, 0, 1] },
  },
};

const digitVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.85, rotate: -6 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 0.6, ease: [0.2, 0, 0, 1] },
  },
};

export function NotFoundContent({
  dict,
  lang,
}: {
  dict: NotFoundDict;
  lang: Locale;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Ambient floating color blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-brand/25 blur-3xl"
        animate={{ y: [0, 24, 0], x: [0, 16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-6rem] top-1/3 size-96 rounded-full bg-hero blur-3xl"
        animate={{ y: [0, -28, 0], x: [0, -14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[-6rem] left-1/3 size-80 rounded-full bg-brand/15 blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <header className="relative px-6 py-6 sm:px-10">
        <Link href={`/${lang}`} aria-label="Afrobraids Connect Home">
          <Image
            src="/logo/logo.webp"
            alt="Afrobraids Connect"
            width={160}
            height={40}
            className="h-8 w-auto"
          />
        </Link>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-2 text-6xl font-black tracking-tight sm:text-8xl"
          >
            {DIGITS.map((digit, index) => (
              <motion.span key={`${digit}-${index}`} variants={digitVariants}>
                <motion.span
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.2,
                  }}
                  className="inline-block bg-gradient-to-b from-brand to-brand-hover bg-clip-text text-transparent"
                >
                  {digit}
                </motion.span>
              </motion.span>
            ))}
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="w-fit rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand"
          >
            {dict.eyebrow}
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="max-w-xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {dict.title}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-md text-base text-muted-foreground"
          >
            {dict.subtitle}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-2 flex flex-wrap items-center justify-center gap-3"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={`/${lang}`}
                className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                <Home className="size-4" />
                {dict.homeCta}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={`/${lang}/search`}
                className="flex items-center gap-2 rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-brand hover:text-brand"
              >
                <Search className="size-4" />
                {dict.searchCta}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
