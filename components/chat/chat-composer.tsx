"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { ChatThreadDict } from "@/components/chat/types";

const MAX_LENGTH = 2000;

export function ChatComposer({
  onSend,
  isSending,
  dict,
}: {
  onSend: (body: string) => void;
  isSending: boolean;
  dict: ChatThreadDict;
}) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-surface p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder={dict.composerPlaceholder}
          rows={1}
          maxLength={MAX_LENGTH}
          className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-border bg-input px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-placeholder focus:border-brand"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || isSending}
          aria-label={dict.sendButton}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-40"
        >
          {isSending ? (
            <Loader className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
