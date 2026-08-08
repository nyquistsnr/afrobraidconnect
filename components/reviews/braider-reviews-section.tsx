"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { braidersApi } from "@/lib/api/braiders-client";
import { ReviewCard } from "./review-card";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { StarRating } from "./star-rating";

export function BraiderReviewsSection({
  braiderId,
  rating,
  lang,
  dict,
}: {
  braiderId: string;
  rating: string | null;
  lang: Locale;
  dict: Dictionary["reviews"];
}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["braider-reviews", braiderId],
    queryFn: ({ pageParam = 1 }) =>
      braidersApi.getReviews(braiderId, { page: pageParam, page_size: 10 }, lang),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
  });

  const reviews = data?.pages.flatMap((p) => p.items) ?? [];

  if (status === "pending") {
    return (
      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h2 className="text-xl font-semibold text-foreground">{dict.title}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-border/40" />
          <div className="h-40 animate-pulse rounded-2xl bg-border/40" />
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="flex flex-col gap-6 border-t border-border pt-8">
        <h2 className="text-xl font-semibold text-foreground">{dict.title}</h2>
        <p className="text-sm text-red-500">{dict.failedToLoad}</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 border-t border-border pt-8">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">{dict.title}</h2>
        {rating && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-sm">
            <StarRating rating={Number(rating)} starClassName="size-4" />
            <span className="text-sm font-bold text-foreground">{rating}</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-border/5 py-16 text-center">
          <Star className="size-8 text-icon-muted" />
          <p className="text-sm font-medium text-muted-foreground">
            {dict.noReviews}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} lang={lang} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-[120px]"
              >
                {isFetchingNextPage ? "..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
