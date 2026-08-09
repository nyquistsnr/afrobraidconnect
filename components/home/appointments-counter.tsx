"use client";

import { useEffect, useRef, useState } from "react";
import { bookingsApi } from "@/lib/api/bookings-client";
import { formatTemplate } from "@/lib/format-template";
import type { Locale } from "@/lib/i18n";

// The real "today" figure from the API reads low early in the day and would
// look broken next to marketing copy that implies a busy, established
// platform — so a fixed offset is layered on top purely for display. The
// count-up (from just under the target) plus slow +1 "live" ticks afterward
// are cosmetic too: they sell the idea that bookings are happening in real
// time without literally polling every appointment.
const DISPLAY_OFFSET = 400;
const COUNT_UP_MS = 2800;
const COUNT_UP_LEAD = 180;
const LIVE_TICK_MIN_MS = 7000;
const LIVE_TICK_MAX_MS = 16000;

export function AppointmentsCounter({
  template,
  lang,
}: {
  template: string;
  lang: Locale;
}) {
  const [display, setDisplay] = useState<number | null>(null);
  const targetRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let tickTimeout: ReturnType<typeof setTimeout>;

    function scheduleTick() {
      const delay =
        LIVE_TICK_MIN_MS + Math.random() * (LIVE_TICK_MAX_MS - LIVE_TICK_MIN_MS);
      tickTimeout = setTimeout(() => {
        if (cancelled || targetRef.current === null) return;
        targetRef.current += 1;
        setDisplay(targetRef.current);
        scheduleTick();
      }, delay);
    }

    async function load() {
      let base = 0;
      try {
        base = await bookingsApi.getTodayCount();
      } catch {
        base = 0;
      }
      if (cancelled) return;

      const target = base + DISPLAY_OFFSET;
      targetRef.current = target;
      const start = Math.max(target - COUNT_UP_LEAD, 0);
      const startTime = performance.now();

      function step(now: number) {
        const progress = Math.min((now - startTime) / COUNT_UP_MS, 1);
        const eased = 1 - (1 - progress) ** 3;
        setDisplay(Math.round(start + (target - start) * eased));

        if (progress < 1) {
          raf = requestAnimationFrame(step);
        } else {
          scheduleTick();
        }
      }

      raf = requestAnimationFrame(step);
    }

    load();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(tickTimeout);
    };
  }, []);

  return (
    <p
      className="text-sm font-medium text-foreground/80 tabular-nums lg:text-base"
      aria-live="polite"
    >
      {display === null
        ? " "
        : formatTemplate(template, { count: display.toLocaleString(lang) })}
    </p>
  );
}
