"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "lg";

// "lg" takes over the full screen on mobile (a native-feeling sheet, since
// its content — e.g. the service-type style configurator — is too tall for
// a small centered dialog there) and becomes a centered, capped-height
// dialog from "sm" up. "sm" stays a small centered dialog at every width.
const WRAPPER_CLASSES: Record<ModalSize, string> = {
  sm: "items-center p-4",
  lg: "items-end p-0 sm:items-center sm:p-4",
};

const PANEL_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm rounded-2xl border border-border p-6 search-panel-in",
  lg: "max-w-2xl max-h-full rounded-t-2xl border-0 p-4 sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-border sm:p-6 search-sheet-in sm:search-panel-in",
};

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  size = "sm",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy: string;
  size?: ModalSize;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex justify-center ${WRAPPER_CLASSES[size]}`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative flex max-h-full w-full flex-col overflow-y-auto bg-surface shadow-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${PANEL_CLASSES[size]}`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
