import type { Locale } from "@/lib/i18n";
import type { NotificationResponse } from "@/lib/api/types";

// Mirrors the API doc's related_type -> route mapping. Unrecognized
// related_type values (the enum is expected to grow) fall through to null,
// meaning the row is still shown but isn't clickable-through anywhere.
export function getNotificationTarget(
  notification: Pick<NotificationResponse, "related_type" | "related_id">,
  lang: Locale
): string | null {
  if (!notification.related_id) return null;
  switch (notification.related_type) {
    case "chat_thread":
      return `/${lang}/chat/${notification.related_id}`;
    case "booking":
      return `/${lang}/bookings/${notification.related_id}`;
    default:
      return null;
  }
}
