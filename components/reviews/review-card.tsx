import { formatDistanceToNow } from "date-fns";
import { StarRating } from "./star-rating";
import type { PublicReview } from "@/lib/api/types";
import { enUS, fr, de } from "date-fns/locale";
import type { Locale } from "@/lib/i18n";

const locales = {
  en: enUS,
  fr,
  de,
};

function formatName(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  return `${first} ${last[0]}.`;
}

export function ReviewCard({ review, lang }: { review: PublicReview; lang: Locale }) {
  const dateStr = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: locales[lang],
  });

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-foreground">
            {formatName(review.customer_name)}
          </span>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-border/50 px-2 py-1">
          <StarRating rating={review.rating} starClassName="size-3" />
          <span className="text-xs font-bold text-foreground">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>
      {review.comment && (
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
          {review.comment}
        </p>
      )}
    </div>
  );
}
