"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

export function useLogout(lang: Locale) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    // The refresh token only lives in the httpOnly session cookie, so it has
    // to be revoked server-side via this custom route, which clears that
    // cookie via Set-Cookie on its response. But every useSession() consumer
    // (header, tab bar) reads from the client-side SessionProvider's own
    // cached copy, which nothing here tells to refetch — router.push +
    // router.refresh() only re-run server components, they don't touch that
    // client cache, so the stale logged-in name/menu items lingered until a
    // manual page reload. A hard navigation forces SessionProvider to
    // remount and re-fetch /api/auth/session fresh against the now-cleared
    // cookie, so this is a real page load rather than router.push.
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = `/${lang}`;
  }

  return { logout, isLoggingOut };
}
