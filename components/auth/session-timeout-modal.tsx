"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const THRESHOLD_MS = 120_000; // 2 minutes

export function SessionTimeoutModal({
  lang,
  dict,
}: {
  lang: Locale;
  dict: Dictionary["common"]["sessionTimeout"];
}) {
  const { data: session, status, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reconstruct the full path they are currently on
  const currentPath =
    pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");

  const buildLoginUrl = () => {
    return `/${lang}/login?callbackUrl=${encodeURIComponent(currentPath)}`;
  };

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signOut({ callbackUrl: buildLoginUrl() });
      return;
    }

    if (status !== "authenticated" || !session?.accessTokenExpires) {
      setIsOpen(false);
      return;
    }

    const checkExpiry = () => {
      const now = Date.now();
      const expiresAt = session.accessTokenExpires;
      const msUntilExpiry = expiresAt - now;

      if (msUntilExpiry <= 0) {
        // Token has expired, sign out
        signOut({ callbackUrl: buildLoginUrl() });
      } else if (msUntilExpiry <= THRESHOLD_MS) {
        // Within the 2-minute warning window
        setIsOpen(true);
      } else {
        // Reset state if we somehow got a new token
        setIsOpen(false);
      }
    };

    // Check immediately
    checkExpiry();

    // Set up an interval to check every second
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [session, status, lang, pathname, searchParams]);

  const handleContinue = async () => {
    setIsUpdating(true);
    // This will trigger the NextAuth `jwt` callback, which will see we are 
    // within 2 mins of expiry and perform a token refresh.
    await update();
    setIsUpdating(false);
    setIsOpen(false);
  };

  const handleLogout = () => {
    setIsOpen(false);
    signOut({ callbackUrl: buildLoginUrl() });
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {}} // User must explicitly choose
      labelledBy="session-timeout-title"
      size="sm"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-brand/10 p-3 text-brand">
          <Clock className="size-8" />
        </div>
        <h2
          id="session-timeout-title"
          className="mb-2 text-xl font-semibold text-foreground"
        >
          {dict?.title ?? "Session expiring soon"}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {dict?.description ??
            "For your security, your session will expire in a couple of minutes due to inactivity. Would you like to stay signed in?"}
        </p>
        
        <div className="flex w-full flex-col gap-3">
          <Button
            variant="primary"
            onClick={handleContinue}
            disabled={isUpdating}
          >
            {isUpdating
              ? dict?.updating ?? "Refreshing..."
              : dict?.continue ?? "Yes, keep me signed in"}
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isUpdating}
          >
            {dict?.logout ?? "No, sign me out"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
