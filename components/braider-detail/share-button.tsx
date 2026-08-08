"use client";

import { Share2 } from "lucide-react";
import { toast } from "react-toastify";

export function ShareButton({
  title,
  label,
  copiedMessage,
  failedMessage,
}: {
  title: string;
  label: string;
  copiedMessage: string;
  failedMessage: string;
}) {
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled the share sheet — not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success(copiedMessage);
    } catch {
      toast.error(failedMessage);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-foreground underline underline-offset-2 transition-colors hover:bg-border/40"
    >
      <Share2 className="size-4" />
      {label}
    </button>
  );
}
