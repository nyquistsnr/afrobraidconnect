"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function useLogout(lang: Locale) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setIsLoggingOut(false);
    router.push(`/${lang}`);
    router.refresh();
  }

  return { logout, isLoggingOut };
}
