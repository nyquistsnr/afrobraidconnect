"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarX2, Search } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { Locale } from "@/lib/i18n";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { bookingsApi } from "@/lib/api/bookings-client";
import { formatTemplate } from "@/lib/format-template";
import { todayISODate, yesterdayISODate } from "@/components/bookings/format";
import { BookingCard } from "@/components/bookings/booking-card";
import { BookingsPaginationControl } from "@/components/bookings/pagination-control";
import type { BookingsListDict, BookingStatusDict } from "@/components/bookings/types";

type Tab = "upcoming" | "past" | "all";
const PAGE_SIZE = 10;

export function BookingsListView({
  lang,
  dict,
  statusDict,
}: {
  lang: Locale;
  dict: BookingsListDict;
  statusDict: BookingStatusDict;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  function handleTabChange(next: Tab) {
    setTab(next);
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  const dateParams =
    tab === "upcoming"
      ? { date_from: todayISODate() }
      : tab === "past"
        ? { date_to: yesterdayISODate() }
        : {};

  const accessToken = session?.accessToken;
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["bookings", tab, debouncedSearch, page],
    queryFn: () =>
      bookingsApi.list(accessToken!, lang, {
        ...dateParams,
        search: debouncedSearch || undefined,
        page,
        page_size: PAGE_SIZE,
      }),
    enabled: sessionStatus === "authenticated" && !!accessToken,
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const isSearching = debouncedSearch.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{dict.pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.pageSubtitle}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit items-center gap-1 rounded-full border border-border p-1">
          {(
            [
              ["upcoming", dict.tabUpcoming],
              ["past", dict.tabPast],
              ["all", dict.tabAll],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              aria-pressed={tab === key}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-icon-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={dict.searchPlaceholder}
            className="w-full rounded-full border border-border bg-input py-2.5 pr-4 pl-10 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <AlertCircle className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">{dict.errorTitle}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{dict.errorSubtitle}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
          >
            {dict.retry}
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
          <CalendarX2 className="size-10 text-icon-muted" />
          <h2 className="text-base font-semibold text-foreground">
            {isSearching
              ? dict.emptySearchTitle
              : tab === "past"
                ? dict.emptyPastTitle
                : dict.emptyUpcomingTitle}
          </h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {isSearching
              ? dict.emptySearchSubtitle
              : tab === "past"
                ? dict.emptyPastSubtitle
                : dict.emptyUpcomingSubtitle}
          </p>
          {!isSearching && tab !== "past" && (
            <Link
              href={`/${lang}`}
              className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              {dict.exploreCta}
            </Link>
          )}
        </div>
      ) : (
        <div
          className={`flex flex-col gap-6 transition-opacity ${isFetching ? "opacity-60" : ""}`}
        >
          {data && data.pagination.total_items > 0 && (
            <p className="text-sm text-muted-foreground">
              {formatTemplate(
                data.pagination.total_items === 1
                  ? dict.resultsCountOne
                  : dict.resultsCountOther,
                { count: data.pagination.total_items }
              )}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {items.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                lang={lang}
                dict={dict}
                statusDict={statusDict}
              />
            ))}
          </div>

          {data && (
            <BookingsPaginationControl
              pagination={data.pagination}
              onChangePage={setPage}
              dict={dict}
            />
          )}
        </div>
      )}
    </div>
  );
}
