import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export function EstherAiCta({
  dict,
  lang,
}: {
  dict: Dictionary["estherAi"];
  lang: Locale;
}) {
  return (
    <div className="relative isolate w-full max-w-4xl mx-auto overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand/90 to-black p-8 sm:p-10 shadow-2xl backdrop-blur-md transition-transform hover:scale-[1.02]">
      {/* Abstract decorative elements */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
      
      <div className="relative z-10 flex flex-col items-center text-center gap-6 sm:flex-row sm:text-left sm:justify-between">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-yellow-300" />
            <span>AI-Powered</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {dict.ctaTitle}
          </h2>
          <p className="max-w-lg text-sm text-white/70 sm:text-base">
            {dict.ctaDescription}
          </p>
        </div>
        
        <div className="mt-2 shrink-0 sm:mt-0">
          <Link
            href={`/${lang}/esther-ai`}
            className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand transition-all hover:bg-white/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {dict.ctaButton}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
