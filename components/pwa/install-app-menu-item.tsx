"use client";

import { MonitorDown, Smartphone } from "lucide-react";
import {
  openInstallPrompt,
  useInstallEnvironment,
  useNativeInstallEvent,
} from "@/lib/pwa/install";

// "Install app" entry for the header / mobile profile menus. Opens the
// install prompt on demand; hidden when already running as the installed
// app, and on desktop unless the browser can actually install it.
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
  if (env.platform === "desktop" && !nativeEvent) return null;

  const Icon = env.platform === "desktop" ? MonitorDown : Smartphone;
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
