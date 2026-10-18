"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// Exposes the install event captured by installCaptureScript (see
// install-capture-script.ts) plus platform detection to React.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __afrobraidInstallEvent?: BeforeInstallPromptEvent | null;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export type InstallPlatform =
  // In-app browsers (Instagram, TikTok, Facebook…) can't install anything —
  // the user first has to open the page in their real browser.
  | "in-app"
  | "ios-safari"
  | "ios-other" // Chrome/Edge/Firefox on iOS: share sheet lives top-right
  | "android"
  // Chrome / Edge / Brave / Opera on Windows, macOS, Linux, ChromeOS —
  // installable via beforeinstallprompt or the address-bar install icon.
  | "desktop-chromium"
  // Safari 17+ on macOS Sonoma+: File / Share → "Add to Dock".
  | "mac-safari"
  // Firefox and others: can't install web apps; point to another browser.
  | "desktop-other";

export function isDesktopPlatform(platform: InstallPlatform): boolean {
  return platform === "desktop-chromium" || platform === "mac-safari" || platform === "desktop-other";
}

export interface InstallEnvironment {
  platform: InstallPlatform;
  isIPad: boolean;
  isStandalone: boolean;
}

const IN_APP_UA = /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|BytedanceWebview|Snapchat|Line\/|LinkedInApp|Pinterest|Twitter/i;

export function detectInstallEnvironment(): InstallEnvironment {
  const ua = navigator.userAgent;
  // iPadOS reports itself as a Mac; touch support gives it away.
  const isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const isIOS = /iPhone|iPod/.test(ua) || isIPad;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    navigator.standalone === true;

  let platform: InstallPlatform;
  if (IN_APP_UA.test(ua)) platform = "in-app";
  else if (isIOS) platform = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? "ios-other" : "ios-safari";
  else if (/Android/.test(ua)) platform = "android";
  else if (/Chrome|Chromium|CriOS|Edg\//.test(ua) && !/Firefox/.test(ua)) platform = "desktop-chromium";
  else if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Firefox/.test(ua)) platform = "mac-safari";
  else platform = "desktop-other";

  return { platform, isIPad, isStandalone };
}

function subscribe(listener: () => void) {
  window.addEventListener("afrobraid:installable", listener);
  return () => window.removeEventListener("afrobraid:installable", listener);
}

// The captured native install event (Android/desktop Chromium), or null
// where the browser doesn't offer one (iOS, Firefox, in-app browsers).
export function useNativeInstallEvent(): BeforeInstallPromptEvent | null {
  return useSyncExternalStore(
    subscribe,
    () => window.__afrobraidInstallEvent ?? null,
    () => null
  );
}

export function useInstallEnvironment(): InstallEnvironment | null {
  const [env, setEnv] = useState<InstallEnvironment | null>(null);
  useEffect(() => {
    // Client-only (reads the UA / display mode), so resolved after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnv(detectInstallEnvironment());
  }, []);
  return env;
}

// Runs the browser's native install dialog. Resolves true if accepted.
export async function runNativeInstall(event: BeforeInstallPromptEvent): Promise<boolean> {
  await event.prompt();
  const { outcome } = await event.userChoice;
  // A prompt event can only be used once.
  window.__afrobraidInstallEvent = null;
  window.dispatchEvent(new Event("afrobraid:installable"));
  if (outcome === "accepted") {
    try {
      localStorage.setItem("afrobraid:pwa-installed", "1");
    } catch {
      // Non-critical.
    }
  }
  return outcome === "accepted";
}

// Lets any part of the app (a menu item, the download page) open the
// install prompt on demand, bypassing the automatic timing rules.
export const OPEN_INSTALL_EVENT = "afrobraid:open-install";

export function openInstallPrompt() {
  window.dispatchEvent(new Event(OPEN_INSTALL_EVENT));
}
