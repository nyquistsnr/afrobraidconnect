"use client";

import { useId } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  dict,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  dict: Dictionary["dashboard"]["logoutModal"];
}) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="text-lg font-bold text-foreground">
        {dict.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{dict.description}</p>

      <div className="mt-6 flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {dict.cancel}
        </Button>
        <Button type="button" onClick={onConfirm} disabled={loading}>
          {dict.confirm}
        </Button>
      </div>
    </Modal>
  );
}
