"use client";

import { MonitorDown, Smartphone } from "lucide-react";
import {
  isDesktopPlatform,
  openInstallPrompt,
  useInstallEnvironment,
  useNativeInstallEvent,
} from "@/lib/pwa/install";

// "Install app" entry for the header / mobile profile menus. Opens the
// install prompt on demand; hidden when already running as the installed
// app, and in desktop Chromium unless the browser can actually install it.
export function InstallAppMenuItem({
  label,
  onSelect,
  className,
  role,
}: {
  label: string;
  onSelect?: () => void;
  className: string;
  role?: string;
}) {
  const env = useInstallEnvironment();
  const nativeEvent = useNativeInstallEvent();
  if (!env || env.isStandalone) return null;
  // Chromium only exposes installability via its event (no event usually
  // means it's already installed); Safari/Firefox get the guided route.
  if (env.platform === "desktop-chromium" && !nativeEvent) return null;

  const Icon = isDesktopPlatform(env.platform) ? MonitorDown : Smartphone;
  return (
    <button
      type="button"
      role={role}
      onClick={() => {
        onSelect?.();
        openInstallPrompt();
      }}
      className={className}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
