"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Locale } from "@/lib/i18n";

export function useLogout(lang: Locale) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    // The refresh token only lives in the httpOnly session cookie, so it has
    // to be revoked server-side via this custom route — but that route
    // clearing the cookie doesn't tell the client-side SessionProvider
    // anything happened, so every useSession() consumer (header, tab bar)
    // keeps rendering the stale authenticated state until something re-fetches
    // it. signOut() here is what actually clears that client-side cache and
    // makes them update immediately instead of only after a page refresh.
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    await signOut({ redirect: false });
    setIsLoggingOut(false);
    router.push(`/${lang}`);
    router.refresh();
  }

  return { logout, isLoggingOut };
}
