"use client";

import { useMemo, type ComponentProps } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchResultsView } from "@/components/search-results/search-results-view";
import { parseSearchParams } from "@/lib/search-query";
import type { BraiderSearchItem, PaginatedData } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n";
import type { SearchResultsDict } from "@/components/search-results/types";

type SiteHeaderProps = ComponentProps<typeof SiteHeader>;

// Reads the search straight from the URL (not from server props) so the
// header search bar stays in sync when the results view rewrites the query
// string in place via history.pushState — e.g. after "Search this area".
export function SearchPageClient({
  lang,
  initialData,
  initialKey,
  headerDict,
  common,
  notificationsDict,
  dict,
}: {
  lang: Locale;
  initialData: PaginatedData<BraiderSearchItem> | null;
  initialKey: string;
  headerDict: SiteHeaderProps["dict"];
  common: SiteHeaderProps["common"];
  notificationsDict: SiteHeaderProps["notificationsDict"];
  dict: SearchResultsDict;
}) {
  const searchParams = useSearchParams();
  const { ui } = useMemo(
    () => parseSearchParams(Object.fromEntries(searchParams.entries())),
    [searchParams]
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <SiteHeader
        lang={lang}
        dict={headerDict}
        common={common}
        notificationsDict={notificationsDict}
        initialLocation={ui.location}
        initialStyle={ui.style}
        initialDateRange={ui.dateRange}
      />
      <SearchResultsView
        lang={lang}
        initialData={initialData}
        initialKey={initialKey}
        dict={dict}
      />
    </div>
  );
}
