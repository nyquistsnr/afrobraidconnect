"use client";

import { useIsNavigating } from "@/lib/navigation/use-pending-navigation";

// Slim brand-colored bar pinned to the top of the viewport while a
// usePendingNavigation push/replace is waiting on the next page.
export function NavigationProgress() {
  const isNavigating = useIsNavigating();

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px] overflow-hidden transition-opacity duration-300 ${
        isNavigating ? "opacity-100 delay-100" : "opacity-0"
      }`}
    >
      <div className="search-progress h-full w-1/3 rounded-full bg-brand shadow-[0_0_10px] shadow-brand/70" />
    </div>
  );
}
