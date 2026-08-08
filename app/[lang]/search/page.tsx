import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { SiteHeader } from "@/components/layout/site-header";
import { SearchResultsView } from "@/components/search-results/search-results-view";
import { braidersApi } from "@/lib/api/braiders-client";
import { parseSearchParams } from "@/lib/search-query";
import type { BraiderSearchItem, PaginatedData } from "@/lib/api/types";

export default async function SearchPage({
  params,
  searchParams,
}: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const sp = await searchParams;
  const dict = await getDictionary(lang);
  const { ui, api } = parseSearchParams(sp);

  let result: PaginatedData<BraiderSearchItem> | null = null;
  let hasError = false;
  try {
    result = await braidersApi.search(api, lang);
  } catch {
    hasError = true;
  }

  const center =
    ui.location?.lat != null && ui.location?.lng != null
      ? { lat: ui.location.lat, lng: ui.location.lng }
      : null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        common={dict.common}
        initialLocation={ui.location}
        initialStyle={ui.style}
        initialDateRange={ui.dateRange}
      />
      <SearchResultsView
        items={result?.items ?? []}
        pagination={result?.pagination ?? null}
        hasError={hasError}
        locationLabel={ui.location?.label ?? null}
        radiusKm={ui.radiusKm ?? 5}
        center={center}
        dict={dict.searchResults}
      />
    </div>
  );
}
