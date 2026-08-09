"use client";

import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BraiderCard } from "@/components/search-results/braider-card";
import { braidersApi } from "@/lib/api/braiders-client";
import { getRecentLocations } from "@/lib/recent-locations";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Loader2 } from "lucide-react";

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

  const queries = useQueries({
    queries: TABS.map((tab) => ({
      queryKey: ["curated-braiders", tab, lang],
      queryFn: async () => {
        const recent = getRecentLocations()[0];
        const params: Parameters<typeof braidersApi.getCuratedList>[1] = {
          page_size: 5,
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
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
        {dict.title}
      </h2>

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

      <div className="mt-6 min-h-[300px]">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="size-8 animate-spin text-brand" />
          </div>
        ) : isError ? (
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-foreground">{dict.error}</p>
          </div>
        ) : (
          <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <AnimatePresence mode="popLayout">
              {activeBraiders.map((braider, index) => (
                <motion.div
                  key={`${activeTab}-${braider.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    ease: "easeOut",
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
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
