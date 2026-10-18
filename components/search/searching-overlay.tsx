"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, MapPin, Sparkles } from "lucide-react";
import type { SearchDict } from "@/components/search/types";

const STEP_MS = 1400;

// Full-screen "finding braiders" state shown from the moment Search is
// pressed until the results page is ready (the search bars hold it open
// via useTransition's isPending around router.push). Fades in after a short
// delay (see .searching-overlay in globals.css) so a fast, cached navigation
// doesn't flash it.
export function SearchingOverlay({
  open,
  locationLabel,
  styleName,
  dateLabel,
  dict,
}: {
  open: boolean;
  locationLabel?: string | null;
  styleName?: string | null;
  dateLabel?: string | null;
  dict: SearchDict;
}) {
  const steps = [dict.searchingStepAvailability, dict.searchingStepStyle, dict.searchingStepDistance];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % steps.length), STEP_MS);
    return () => {
      window.clearInterval(timer);
      setStep(0);
    };
  }, [open, steps.length]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="searching-overlay fixed inset-0 z-[80] flex items-center justify-center bg-background/90 px-4 backdrop-blur-2xl"
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        {/* Radar: rings ripple out from the searched spot while "found"
            dots pop in around it — reads as "looking around you". */}
        <div className="relative mb-8 flex size-44 items-center justify-center sm:size-52">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="searching-ring absolute inset-0 rounded-full border border-brand/50 bg-brand/[0.06]"
              style={{ animationDelay: `${i * 0.7}s` }}
              aria-hidden
            />
          ))}
          <span className="absolute inset-[22%] rounded-full border border-dashed border-brand/25" aria-hidden />
          <span className="searching-sweep absolute inset-0 rounded-full" aria-hidden />
          {[
            { top: "14%", left: "68%", delay: "0.3s" },
            { top: "66%", left: "16%", delay: "1.1s" },
            { top: "74%", left: "72%", delay: "1.9s" },
            { top: "26%", left: "20%", delay: "2.6s" },
          ].map((dot) => (
            <span
              key={dot.delay}
              className="searching-dot absolute size-3 rounded-full border-2 border-surface bg-foreground shadow-md"
              style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
              aria-hidden
            />
          ))}
          <span className="relative flex size-16 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_10px_30px_-6px] shadow-brand/60">
            <MapPin className="size-7" strokeWidth={2.25} />
          </span>
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-balance text-foreground sm:text-2xl">
          {locationLabel ? (
            // Split around the placeholder so the place name can be
            // highlighted wherever each language puts it in the sentence.
            dict.searchingNear.split("{location}").map((part, i) => (
              <span key={i}>
                {i > 0 && <span className="text-brand">{locationLabel}</span>}
                {part}
              </span>
            ))
          ) : (
            dict.searchingAnywhere
          )}
        </h2>

        {(styleName || dateLabel) && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {styleName && (
              <span className="flex max-w-full items-center gap-1.5 truncate rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
                <Sparkles className="size-3.5 shrink-0 text-brand" />
                <span className="truncate">{styleName}</span>
              </span>
            )}
            {dateLabel && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground">
                <Calendar className="size-3.5 text-brand" />
                {dateLabel}
              </span>
            )}
          </div>
        )}

        <p key={step} className="searching-step mt-5 h-5 text-sm text-muted-foreground">
          {steps[step]}
        </p>

        <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-border/60" aria-hidden>
          <div className="search-progress h-full w-1/3 rounded-full bg-brand" />
        </div>
      </div>
    </div>,
    document.body
  );
}
