"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { StylePublicResponse } from "@/lib/api/types";
import { EstherAiForm } from "@/components/esther-ai/esther-ai-form";
import { EstherAiHistory } from "@/components/esther-ai/esther-ai-history";

export function EstherAiShell({
  dict,
  lang,
  accessToken,
  styles,
}: {
  dict: Dictionary["estherAi"];
  lang: Locale;
  accessToken: string;
  styles: StylePublicResponse[];
}) {
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex w-full max-w-sm overflow-hidden rounded-full border border-border bg-surface p-1 shadow-sm mb-8">
        <button
          onClick={() => setActiveTab("new")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
            activeTab === "new"
              ? "bg-foreground text-background shadow"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {dict.tabNew}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
            activeTab === "history"
              ? "bg-foreground text-background shadow"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {dict.tabHistory}
        </button>
      </div>

      <div className="w-full">
        {activeTab === "new" ? (
          <EstherAiForm dict={dict} lang={lang} accessToken={accessToken} styles={styles} />
        ) : (
          <EstherAiHistory dict={dict} lang={lang} accessToken={accessToken} />
        )}
      </div>
    </div>
  );
}
