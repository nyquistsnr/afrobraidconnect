"use client";

import { useEffect, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BraiderCard } from "@/components/search-results/braider-card";
import { braidersApi } from "@/lib/api/braiders-client";
import { getRecentLocations } from "@/lib/recent-locations";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loader } from "@/components/ui/loader";

type TabKey = "trending" | "topRated" | "new" | "recommended";

const TABS: TabKey[] = ["trending", "topRated", "new", "recommended"];

const API_KEYS: Record<TabKey, "trending" | "top-rated" | "new" | "recommended"> = {
  trending: "trending",
  topRated: "top-rated",
  new: "new",
  recommended: "recommended",
};

export function CuratedBraiders({
  lang,
  dict,
  searchResultsDict,
}: {
  lang: Locale;
  dict: Dictionary["home"]["curated"];
  searchResultsDict: Dictionary["searchResults"];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("trending");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const queries = useQueries({
    queries: TABS.map((tab) => ({
      queryKey: ["curated-braiders", tab, lang],
      queryFn: async () => {
        const recent = getRecentLocations()[0];
        const params: Parameters<typeof braidersApi.getCuratedList>[1] = {
          page_size: 10,
        };

        if (recent?.lat != null && recent?.lng != null) {
          params.lat = recent.lat;
          params.lng = recent.lng;
        } else {
          params.country_code = lang === "en" ? "DE" : lang.toUpperCase();
        }

        return braidersApi.getCuratedList(API_KEYS[tab], params, lang);
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  const availableTabs = TABS.filter((_, index) => {
    const data = queries[index].data;
    return data && data.items.length > 0;
  });

  useEffect(() => {
    if (!isLoading && availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [isLoading, availableTabs, activeTab]);

  if (!isLoading && availableTabs.length === 0 && !isError) {
    return null;
  }

  const activeQueryIndex = TABS.indexOf(activeTab);
  const activeBraiders = queries[activeQueryIndex]?.data?.items ?? [];

  return (
    <section className="py-12 md:py-20 max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
          {dict.title}
        </h2>

        {activeBraiders.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-border/50 text-foreground"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollRight}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-border/50 text-foreground"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {availableTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-foreground text-background shadow-md"
                  : "bg-surface text-muted-foreground border border-border hover:bg-border/40 hover:text-foreground"
              }`}
            >
              {dict.tabs[tab]}
            </button>
          );
        })}
      </div>

      {/*
        Fixed-height wrapper prevents layout shift during tab transitions.
        The outer overflow-hidden clips any motion artifacts at the edges.
      */}
      <div className="mt-6 min-h-[380px] relative">
        {isLoading ? (
          <div className="flex h-[380px] items-center justify-center">
            <Loader className="size-8 animate-spin text-brand" />
          </div>
        ) : isError ? (
          <div className="flex h-[380px] flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-foreground">{dict.error}</p>
          </div>
        ) : (
          /*
            mode="wait" ensures the exiting tab fully fades out before
            the entering tab fades in — no overlapping cards fighting for
            the same space.  initial={false} prevents the animation
            running on the very first render.
          */
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <div
                ref={scrollRef}
                className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {activeBraiders.map((braider, index) => (
                  <motion.div
                    key={braider.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.28,
                      // Tight stagger so cards cascade in quickly without lag
                      delay: index * 0.04,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="min-w-[280px] sm:min-w-[320px] max-w-[320px] shrink-0 snap-start"
                  >
                    <BraiderCard
                      item={braider}
                      isHighlighted={hoveredId === braider.id}
                      onHover={setHoveredId}
                      lang={lang}
                      dict={searchResultsDict}
                      searchLinkContext={{
                        location: null,
                        lat: null,
                        lng: null,
                        country_code: null,
                        date_from: null,
                        date_to: null,
                        radius_km: null,
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
