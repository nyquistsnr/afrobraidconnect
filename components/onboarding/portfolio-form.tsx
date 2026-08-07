"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ImagePlus, Trash2 } from "lucide-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";
import type {
  PortfolioResponse,
  PortfolioImageResponse,
  PortfolioImageContentType,
} from "@/lib/api/types";
import { onboardingApi } from "@/lib/api/onboarding-client";
import { ApiError } from "@/lib/api/auth-client";
import { getAuthErrorMessage } from "@/lib/api/error-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES: PortfolioImageContentType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function PortfolioForm({
  dict,
  common,
  lang,
  initialData,
}: {
  dict: Dictionary["onboarding"]["portfolio"];
  common: Dictionary["common"];
  lang: Locale;
  initialData: PortfolioResponse;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [portfolio, setPortfolio] = useState(initialData);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const accessToken = session!.accessToken;
      const { upload_url, object_key } = await onboardingApi.getPortfolioUploadUrl(
        accessToken,
        { content_type: file.type as PortfolioImageContentType }
      );
      await onboardingApi.uploadPortfolioFile(upload_url, file);
      return onboardingApi.confirmPortfolioImage(accessToken, { object_key }, lang);
    },
    onSuccess: (newPhoto) => {
      setPortfolio((prev) => ({
        ...prev,
        images: [...prev.images, newPhoto],
        is_complete: prev.images.length + 1 >= prev.min_required,
      }));
      toast.success(dict.toasts.uploaded);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await onboardingApi.deletePortfolioImage(session!.accessToken, imageId);
      return imageId;
    },
    onSuccess: (deletedId) => {
      setPortfolio((prev) => {
        const nextImages = prev.images.filter((img) => img.id !== deletedId);
        return {
          ...prev,
          images: nextImages,
          is_complete: nextImages.length >= prev.min_required,
        };
      });
      toast.success(dict.toasts.removed);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  const updateCaptionMutation = useMutation({
    mutationFn: async ({ imageId, caption }: { imageId: string; caption: string }) => {
      return onboardingApi.updatePortfolioImage(
        session!.accessToken,
        imageId,
        { caption: caption.trim() || null },
        lang
      );
    },
    onSuccess: (updatedPhoto) => {
      setPortfolio((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === updatedPhoto.id ? updatedPhoto : img
        ),
      }));
      toast.success(dict.toasts.captionUpdated);
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : undefined;
      toast.error(getAuthErrorMessage(code, common.errors));
    },
  });

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type as PortfolioImageContentType)) {
      toast.error(getAuthErrorMessage("INVALID_PORTFOLIO_IMAGE_UPLOAD", common.errors));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(getAuthErrorMessage("INVALID_PORTFOLIO_IMAGE_UPLOAD", common.errors));
      return;
    }

    uploadMutation.mutate(file);
  }

  function handleContinue() {
    router.push(`/${lang}/onboarding`);
  }

  const images = portfolio.images;
  const isComplete = portfolio.is_complete;

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground">{dict.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{dict.subtitle}</p>

      <div className="mt-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {images.map((image) => {
            const captionKey = `caption_${lang}` as keyof PortfolioImageResponse;
            const captionVal = (image[captionKey] as string) ?? "";
            
            return (
              <div key={image.id} className="relative group overflow-hidden rounded-xl border border-border bg-card">
                <div className="aspect-square w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/75 group-hover:opacity-100"
                  onClick={() => deleteMutation.mutate(image.id)}
                  disabled={deleteMutation.isPending}
                  aria-label={dict.removePhoto}
                >
                  <Trash2 className="size-4" />
                </button>
                <div className="p-3">
                  <Input
                    label={dict.captionLabel}
                    placeholder={dict.captionPlaceholder}
                    defaultValue={captionVal}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val !== captionVal) {
                        updateCaptionMutation.mutate({ imageId: image.id, caption: val });
                      }
                    }}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            );
          })}

          {images.length < 20 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:border-brand/50 hover:bg-brand/5"
              disabled={uploadMutation.isPending}
            >
              <ImagePlus className="mb-2 size-6" />
              <span className="text-sm font-medium">{dict.addPhoto}</span>
              {uploadMutation.isPending && (
                <span className="mt-1 text-xs">{common.loading}</span>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_PHOTO_TYPES.join(",")}
          className="hidden"
          onChange={handleFileSelect}
        />

        {!isComplete && (
          <p className="text-sm text-destructive">{dict.minPhotosRequired}</p>
        )}

        <Button
          type="button"
          onClick={handleContinue}
          disabled={!isComplete}
          className="w-full"
        >
          {dict.continue}
        </Button>
      </div>
    </div>
  );
}
