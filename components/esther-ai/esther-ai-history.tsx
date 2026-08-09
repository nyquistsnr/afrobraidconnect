"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, AlertTriangle, AlertCircle, Download } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { TryOnResponse } from "@/lib/api/types";
import { tryonApi } from "@/lib/api/tryon-client";
import { ApiError } from "@/lib/api/auth-client";
import { formatDistanceToNow } from "date-fns";

export function EstherAiHistory({
  dict,
  accessToken,
}: {
  dict: Dictionary["estherAi"];
  accessToken: string;
}) {
  const [history, setHistory] = useState<TryOnResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await tryonApi.list(accessToken);
        setHistory(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(dict.errorGeneric);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [accessToken, dict]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(dict.deleteConfirm)) return;

    setDeletingId(id);
    try {
      await tryonApi.delete(accessToken, id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(dict.errorGeneric);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20">
        <Loader className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="size-10 text-destructive mb-4" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Image
            src="/images/esther-ai/trash-bin.png"
            alt="Empty"
            width={120}
            height={120}
            className="opacity-50"
          />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          {dict.noHistoryTitle}
        </h3>
        <p className="text-muted-foreground max-w-sm">
          {dict.noHistorySubtitle}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full pb-10">
      {history.map((item) => (
        <div
          key={item.id}
          className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-all hover:shadow-md"
        >
          {/* Image Split View (if completed) or Original (if not) */}
          <div className="relative aspect-[4/5] w-full bg-black overflow-hidden">
            {item.status === "COMPLETED" &&
            item.original_url &&
            item.result_url ? (
              <div className="absolute inset-0 flex">
                <div className="relative w-1/2 h-full">
                  <Image
                    src={item.original_url}
                    alt="Original"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 300px"
                  />
                  <div className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md uppercase tracking-wider">
                    {dict.originalLabel}
                  </div>
                </div>
                <div className="relative w-1/2 h-full border-l border-white/20">
                  <Image
                    src={item.result_url}
                    alt="Result"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 300px"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-brand/90 px-2 py-0.5 text-[10px] font-bold text-brand-foreground backdrop-blur-md uppercase tracking-wider">
                    {dict.resultLabel}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0">
                {item.original_url && (
                  <Image
                    src={item.original_url}
                    alt="Original"
                    fill
                    className="object-cover opacity-80"
                    sizes="(max-width: 640px) 100vw, 400px"
                  />
                )}
                {item.status === "PROCESSING" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-white">
                      <Loader className="size-6 animate-spin" />
                      <span className="text-xs font-semibold">
                        {dict.processing}
                      </span>
                    </div>
                  </div>
                )}
                {item.status === "FAILED" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <AlertCircle className="size-8" />
                      <span className="text-xs font-semibold">
                        {dict.failed}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delete button overlay on hover */}
            <button
              onClick={() => handleDelete(item.id)}
              disabled={deletingId === item.id}
              className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:scale-110 disabled:opacity-50"
              title={dict.delete}
            >
              {deletingId === item.id ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          </div>

          <div className="p-4 flex flex-col gap-1">
            <h4 className="font-semibold text-foreground line-clamp-1">
              {item.style?.name || item.description || "Custom Look"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
              })}
            </p>
            
            {item.status === "COMPLETED" && item.original_url && item.result_url && (
              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-border/50">
                <a
                  href={item.original_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="size-3.5" />
                  Original
                </a>
                <a
                  href={item.result_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand/90 transition-colors"
                >
                  <Download className="size-3.5" />
                  Result
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
