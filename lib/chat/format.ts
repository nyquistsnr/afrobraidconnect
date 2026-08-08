import type { Locale } from "@/lib/i18n";

export function formatMessageTime(iso: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Today → time only; this year → short date; otherwise → short date + year,
// matching how most chat inboxes keep the last-activity timestamp compact.
export function formatThreadTimestamp(iso: string, lang: Locale): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return new Intl.DateTimeFormat(lang, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(lang, {
    month: "short",
    day: "numeric",
    year: isThisYear ? undefined : "numeric",
  }).format(date);
}
