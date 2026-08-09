"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { TryOnResponse } from "@/lib/api/types";
import { tryonApi } from "@/lib/api/tryon-client";
import { ApiError } from "@/lib/api/auth-client";

export function EstherAiResult({
  tryonId,
  accessToken,
  dict,
  onReset,
}: {
  tryonId: string;
  accessToken: string;
  dict: Dictionary["estherAi"];
  onReset: () => void;
}) {
  const [tryon, setTryon] = useState<TryOnResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await tryonApi.getById(accessToken, tryonId);
        setTryon(data);

        if (data.status === "PROCESSING") {
          timeoutId = setTimeout(poll, 3000); // poll every 3 seconds
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(dict.errorGeneric);
        }
      }
    };

    poll();

    return () => clearTimeout(timeoutId);
  }, [tryonId, accessToken, dict]);

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border bg-surface p-10 shadow-sm text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{dict.failed}</h3>
        <p className="text-muted-foreground mb-8">{error}</p>
        <button
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-bold text-brand-foreground transition-all hover:bg-brand/90"
        >
          <ArrowLeft className="size-4" />
          {dict.tryAgain}
        </button>
      </div>
    );
  }

  if (!tryon) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border bg-surface p-16 shadow-sm flex flex-col items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand mb-4" />
        <p className="text-muted-foreground">{dict.processing}</p>
      </div>
    );
  }

  if (tryon.status === "FAILED") {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border bg-surface p-10 shadow-sm text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{dict.failed}</h3>
        <p className="text-muted-foreground mb-8">{tryon.error_message || dict.errorGeneric}</p>
        <button
          onClick={onReset}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-8 text-sm font-bold text-brand-foreground transition-all hover:bg-brand/90"
        >
          <ArrowLeft className="size-4" />
          {dict.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      {/* Action Bar */}
      <div className="w-full flex justify-between items-center px-4">
        <button
          onClick={onReset}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-all hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
          {dict.tabNew}
        </button>
        
        {tryon.status === "PROCESSING" && (
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand">
            <Loader2 className="size-4 animate-spin" />
            <span>{dict.processing}</span>
          </div>
        )}
      </div>

      {/* Main Image Container */}
      <div className="w-full relative aspect-[3/4] sm:aspect-[4/5] max-w-md mx-auto overflow-hidden rounded-3xl border-2 border-border shadow-xl bg-black">
        
        {/* If completed, we show the interactive slider */}
        {tryon.status === "COMPLETED" && tryon.original_url && tryon.result_url ? (
          <div 
            className="absolute inset-0 select-none"
            onMouseMove={(e) => {
              if (!isDragging) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
              setSliderPosition((x / rect.width) * 100);
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const touch = e.touches[0];
              const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
              setSliderPosition((x / rect.width) * 100);
            }}
          >
            {/* Background image (Original) */}
            <Image 
              src={tryon.original_url} 
              alt="Original" 
              fill 
              className="object-cover" 
              sizes="(max-width: 640px) 100vw, 400px"
              priority
            />
            
            {/* Foreground image (Result) cropped by clip-path */}
            <div 
              className="absolute inset-0"
              style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
            >
              <Image 
                src={tryon.result_url} 
                alt="Generated" 
                fill 
                className="object-cover" 
                sizes="(max-width: 640px) 100vw, 400px"
                priority
              />
            </div>
            
            {/* Slider handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
                <RefreshCw className="size-4 text-black" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {dict.resultLabel}
            </div>
            <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {dict.originalLabel}
            </div>
          </div>
        ) : (
          /* Processing state - just show original photo */
          <div className="absolute inset-0">
            {tryon.original_url && (
              <Image 
                src={tryon.original_url} 
                alt="Original" 
                fill 
                className="object-cover opacity-50"
                sizes="(max-width: 640px) 100vw, 400px"
              />
            )}
            
            {/* Scanning animation overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="h-2 w-full bg-brand blur-sm shadow-[0_0_20px_10px_rgba(var(--brand-rgb),0.5)] animate-scan-vertical" />
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="size-10 animate-spin text-white mb-4 drop-shadow-md" />
              <div className="rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                {dict.generatingNotice}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      {tryon.status === "COMPLETED" && (
        <div className="mt-4 flex flex-col items-center text-center px-4 max-w-sm">
          {tryon.style && (
            <h4 className="text-xl font-bold text-foreground">{tryon.style.name}</h4>
          )}
          {tryon.description && (
            <p className="mt-2 text-sm text-muted-foreground">{tryon.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
