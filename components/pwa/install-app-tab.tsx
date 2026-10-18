"use client";

import { Download } from "lucide-react";
import {
  isDesktopPlatform,
  openInstallPrompt,
  useInstallEnvironment,
} from "@/lib/pwa/install";

// "Get app" slot in the phone tab bar — always visible on Android, iOS and
// in-app browsers (signed in or not) until the site is running as the
// installed app (standalone display mode), so installing is never more
// than one tap away. Opens the same guided prompt as the menus.
export function InstallAppTab({ label }: { label: string }) {
  const env = useInstallEnvironment();
  if (!env || env.isStandalone || isDesktopPlatform(env.platform)) return null;

  return (
    <button
      type="button"
      onClick={openInstallPrompt}
      className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-semibold text-brand transition-colors hover:text-brand-hover"
    >
      <span className="relative flex size-5 items-center justify-center">
        <Download className="size-5 shrink-0" strokeWidth={2.25} />
        <span className="absolute -top-1 -right-1.5 size-2 rounded-full bg-brand ring-2 ring-surface" aria-hidden />
      </span>
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}
