import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  className?: string;
  starClassName?: string;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  className = "",
  starClassName = "size-4",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const currentDisplay = hoverRating ?? rating;

  return (
    <div
      className={`flex items-center gap-0.5 ${className} ${
        interactive ? "cursor-pointer" : ""
      }`}
      onMouseLeave={() => interactive && setHoverRating(null)}
    >
      {Array.from({ length: maxStars }).map((_, i) => {
        const starValue = i + 1;
        const fillPercent = Math.max(0, Math.min(1, currentDisplay - i));
        return (
          <button
            type="button"
            key={i}
            className={`relative inline-block text-muted-foreground/30 ${
              interactive
                ? "transition-transform hover:scale-110 active:scale-95"
                : "cursor-default"
            }`}
            onClick={(e) => {
              if (interactive && onChange) {
                e.preventDefault();
                onChange(starValue);
              }
            }}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            disabled={!interactive}
          >
            <Star className={`${starClassName} fill-current text-current`} />
            {fillPercent > 0 && (
              <div
                className="absolute left-0 top-0 overflow-hidden text-[#FFD700]"
                style={{ width: `${fillPercent * 100}%` }}
              >
                <Star className={`${starClassName} fill-current text-current`} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
