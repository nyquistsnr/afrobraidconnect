import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { SearchPageClient } from "@/components/search-results/search-page-client";
import { braidersApi } from "@/lib/api/braiders-client";
import { parseSearchParams, searchCacheKey } from "@/lib/search-query";
import type { BraiderSearchItem, PaginatedData } from "@/lib/api/types";

export default async function SearchPage({
  params,
  searchParams,
}: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const sp = await searchParams;
  const dict = await getDictionary(lang);
  const { api } = parseSearchParams(sp);

  // Server-fetched first page so results are in the initial HTML. Every
  // refinement after that (filters, radius, "search this area", paging)
  // runs client-side in SearchPageClient without a server round trip.
  let initialData: PaginatedData<BraiderSearchItem> | null = null;
  try {
    initialData = await braidersApi.search(api, lang);
  } catch {
    initialData = null;
  }

  return (
    <SearchPageClient
      lang={lang}
      initialData={initialData}
      initialKey={searchCacheKey(api)}
      headerDict={dict.siteHeader}
      common={dict.common}
      notificationsDict={dict.notifications}
      dict={dict.searchResults}
    />
  );
}
