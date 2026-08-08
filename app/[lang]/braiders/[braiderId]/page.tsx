import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertCircle, SearchX } from "lucide-react";
import { getDictionary, hasLocale } from "../../dictionaries";
import { SiteHeader } from "@/components/layout/site-header";
import { BraiderDetailView } from "@/components/braider-detail/braider-detail-view";
import { RetryButton } from "@/components/braider-detail/retry-button";
import { braidersApi } from "@/lib/api/braiders-client";
import { ApiError } from "@/lib/api/auth-client";
import { parseSearchParams } from "@/lib/search-query";
import type { BraiderDetailResponse } from "@/lib/api/types";

export default async function BraiderDetailPage({
  params,
  searchParams,
}: PageProps<"/[lang]/braiders/[braiderId]">) {
  const { lang, braiderId } = await params;
  if (!hasLocale(lang)) notFound();

  const sp = await searchParams;
  const styleIdParam = sp.style_id;
  const initialStyleId = Array.isArray(styleIdParam) ? styleIdParam[0] : styleIdParam;
  const dateFromParam = sp.date_from;
  const initialDateFrom = Array.isArray(dateFromParam) ? dateFromParam[0] : dateFromParam;

  // Feeds the header's search bar so it reflects the same location/style/
  // date the customer already had set on /search, instead of resetting.
  const { ui: searchBarState } = parseSearchParams(sp);

  const dict = await getDictionary(lang);

  let braider: BraiderDetailResponse | null = null;
  let status: "ok" | "not_found" | "error" = "ok";

  try {
    braider = await braidersApi.getById(braiderId, lang);
  } catch (err) {
    status = err instanceof ApiError && err.status === 404 ? "not_found" : "error";
  }

  // A braider-card link always includes style_name, but a hand-typed/shared
  // URL might only carry style_id — fall back to the braider's own style
  // list so the search bar doesn't show a blank style name.
  if (braider && searchBarState.style && !searchBarState.style.name) {
    const matched = braider.styles.find(
      (s) => s.style_id === searchBarState.style!.id
    );
    if (matched) {
      searchBarState.style = { ...searchBarState.style, name: matched.name };
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        common={dict.common}
        notificationsDict={dict.notifications}
        initialLocation={searchBarState.location}
        initialStyle={searchBarState.style}
        initialDateRange={searchBarState.dateRange}
      />

      {status === "ok" && braider ? (
        <BraiderDetailView
          braider={braider}
          lang={lang}
          initialStyleId={initialStyleId}
          initialDateFrom={initialDateFrom}
          dict={dict.braiderDetail}
          errorsDict={dict.common.errors}
          reviewsDict={dict.reviews}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
          {status === "not_found" ? (
            <>
              <SearchX className="size-10 text-icon-muted" />
              <h1 className="text-lg font-semibold text-foreground">
                {dict.braiderDetail.notFoundTitle}
              </h1>
              <p className="max-w-xs text-sm text-muted-foreground">
                {dict.braiderDetail.notFoundSubtitle}
              </p>
              <Link
                href={`/${lang}/search`}
                className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
              >
                {dict.braiderDetail.notFoundCta}
              </Link>
            </>
          ) : (
            <>
              <AlertCircle className="size-10 text-icon-muted" />
              <h1 className="text-lg font-semibold text-foreground">
                {dict.braiderDetail.errorTitle}
              </h1>
              <p className="max-w-xs text-sm text-muted-foreground">
                {dict.braiderDetail.errorSubtitle}
              </p>
              <RetryButton label={dict.braiderDetail.retry} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
