"use client";

import { Loader } from "@/components/ui/loader";
import { Modal } from "@/components/ui/modal";

export interface LogoutModalDict {
  title: string;
  description: string;
  cancel: string;
  confirm: string;
}

export function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  isLoggingOut,
  dict,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoggingOut: boolean;
  dict: LogoutModalDict;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="logout-confirm-title" size="sm">
      <h2 id="logout-confirm-title" className="text-lg font-semibold text-foreground">
        {dict.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{dict.description}</p>
      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoggingOut}
          className="rounded-full px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border/40 disabled:opacity-60"
        >
          {dict.cancel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoggingOut}
          className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut && <Loader className="size-4 animate-spin" />}
          {dict.confirm}
        </button>
      </div>
    </Modal>
  );
}
