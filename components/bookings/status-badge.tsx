import type { BookingStatus } from "@/lib/api/types";
import type { BookingStatusDict } from "@/components/bookings/types";

// Soft opacity-tinted chips instead of the app's --background/--foreground
// theme tokens — status color needs to read the same in light and dark mode,
// and the app has no dark: variant wiring (theme is CSS-var driven via
// data-theme, not Tailwind's media-query dark:), so a semantic token
// wouldn't adapt correctly here anyway.
const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-amber-500/10 text-amber-600",
  CONFIRMED: "bg-emerald-500/10 text-emerald-600",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-border text-foreground",
  NO_SHOW: "bg-orange-500/10 text-orange-600",
  CANCELLED_BY_CUSTOMER: "bg-red-500/10 text-red-600",
  CANCELLED_BY_BRAIDER: "bg-red-500/10 text-red-600",
  CANCELLED_NO_PAYMENT: "bg-red-500/10 text-red-600",
  EXPIRED: "bg-border/60 text-muted-foreground",
  DISPUTED: "bg-red-500/10 text-red-600",
};

export function BookingStatusBadge({
  status,
  dict,
}: {
  status: BookingStatus;
  dict: BookingStatusDict;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {dict[status]}
    </span>
  );
}
