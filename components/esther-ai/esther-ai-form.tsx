"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Wand2, ImageIcon } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { StylePublicResponse } from "@/lib/api/types";
import { tryonApi } from "@/lib/api/tryon-client";
import { EstherAiResult } from "@/components/esther-ai/esther-ai-result";
import { ApiError } from "@/lib/api/auth-client";

export function EstherAiForm({
  dict,
  accessToken,
  styles,
}: {
  dict: Dictionary["estherAi"];
  accessToken: string;
  styles: StylePublicResponse[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tryonId, setTryonId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Please select a JPEG, PNG, or WEBP image.");
      return;
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError(null);
  };

  const handleClearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!styleId && !description.trim()) {
      setError(dict.errorMissingInput);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Get upload URL
      const { upload_url, object_key } = await tryonApi.getUploadUrl(accessToken, {
        content_type: file.type as any,
      });

      // 2. Upload the file to S3/R2 directly
      await tryonApi.uploadFile(upload_url, file);

      // 3. Create the try-on
      const tryon = await tryonApi.create(accessToken, {
        object_key,
        style_id: styleId || undefined,
        description: description.trim() || undefined,
      });

      // 4. Move to polling view
      setTryonId(tryon.id);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(dict.errorGeneric);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If a TryOn has been created, render the result poller view instead
  if (tryonId) {
    return (
      <EstherAiResult 
        tryonId={tryonId} 
        accessToken={accessToken} 
        dict={dict} 
        onReset={() => {
          setTryonId(null);
          handleClearFile();
          setDescription("");
          setStyleId("");
        }} 
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* Photo Upload Section */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-bold text-foreground">{dict.uploadTitle}</h3>
          <p className="text-sm text-muted-foreground">{dict.uploadSubtitle}</p>
          
          {!file ? (
            <div 
              className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-10 transition-colors hover:border-brand/50 hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="rounded-full bg-brand/10 p-4 mb-4">
                <ImageIcon className="size-8 text-brand" />
              </div>
              <span className="font-semibold text-brand">{dict.uploadButton}</span>
              <span className="text-xs text-muted-foreground mt-2">JPEG, PNG, WEBP up to 10MB</span>
            </div>
          ) : (
            <div className="relative mt-2 aspect-[3/4] w-full sm:w-64 overflow-hidden rounded-2xl border border-border bg-black mx-auto">
              <Image 
                src={previewUrl!} 
                alt="Preview" 
                fill 
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleClearFile}
                className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
        </div>

        {/* Configuration Section */}
        <div className={`flex flex-col gap-6 transition-opacity duration-300 ${file ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              {dict.styleLabel}
            </label>
            <select
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">{dict.stylePlaceholder}</option>
              {styles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              {dict.descriptionLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={dict.descriptionPlaceholder}
              className="h-24 w-full resize-none rounded-xl border border-border bg-background p-4 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              maxLength={500}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isSubmitting}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand text-base font-bold text-brand-foreground shadow-sm transition-all hover:bg-brand/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                {dict.generating}
              </>
            ) : (
              <>
                <Wand2 className="size-5" />
                {dict.generateButton}
              </>
            )}
          </button>
          
          {isSubmitting && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              {dict.generatingNotice}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
