"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, LayoutGrid, X } from "lucide-react";
import type { BraiderPortfolioImage } from "@/lib/api/types";
import { formatTemplate } from "@/lib/format-template";
import type { BraiderDetailDict } from "@/components/braider-detail/types";

export function PhotoGallery({
  images,
  businessName,
  dict,
}: {
  images: BraiderPortfolioImage[];
  businessName: string;
  dict: BraiderDetailDict;
}) {
  const sorted = [...images].sort((a, b) => a.position - b.position);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : Math.min(i + 1, sorted.length - 1)));
  }, [sorted.length]);
  const showPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
  }, []);

  const alt = useCallback(
    (img: BraiderPortfolioImage) =>
      img.caption || formatTemplate(dict.imageAlt, { name: businessName }),
    [dict.imageAlt, businessName]
  );

  if (sorted.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1760px] px-4 pt-4 sm:px-6 lg:px-10">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-border/30 sm:h-96">
          <div className="flex flex-col items-center gap-2 text-icon-muted">
            <ImageOff className="size-10" />
            <span className="text-sm font-medium">{dict.noPhotos}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1760px] px-4 pt-4 sm:px-6 lg:px-10">
      <div className="relative overflow-hidden rounded-2xl">
        <GalleryGrid images={sorted} alt={alt} onOpen={setLightboxIndex} />
        {sorted.length > 1 && (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-md transition-colors hover:bg-border/40"
          >
            <LayoutGrid className="size-4" />
            {formatTemplate(dict.showAllPhotos, { count: sorted.length })}
          </button>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={sorted}
          index={lightboxIndex}
          alt={alt}
          dict={dict}
          onClose={() => setLightboxIndex(null)}
          onNext={showNext}
          onPrev={showPrev}
        />
      )}
    </div>
  );
}

function GalleryGrid({
  images,
  alt,
  onOpen,
}: {
  images: BraiderPortfolioImage[];
  alt: (img: BraiderPortfolioImage) => string;
  onOpen: (index: number) => void;
}) {
  const count = images.length;

  if (count === 1) {
    return (
      <Tile
        image={images[0]}
        alt={alt(images[0])}
        onClick={() => onOpen(0)}
        className="aspect-[16/9] w-full"
      />
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <Tile
            key={img.id}
            image={img}
            alt={alt(img)}
            onClick={() => onOpen(i)}
            className="aspect-[4/3] w-full"
          />
        ))}
      </div>
    );
  }

  const rest = images.slice(1, 5);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:grid-rows-2 sm:h-[480px]">
      <Tile
        image={images[0]}
        alt={alt(images[0])}
        onClick={() => onOpen(0)}
        className="aspect-[4/3] w-full sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:h-full"
      />
      <div
        className={`hidden gap-2 sm:col-span-2 sm:grid sm:grid-rows-2 ${
          rest.length > 2 ? "sm:grid-cols-2" : "sm:grid-cols-1"
        }`}
      >
        {rest.map((img, i) => (
          <Tile
            key={img.id}
            image={img}
            alt={alt(img)}
            onClick={() => onOpen(i + 1)}
            className="h-full w-full"
          />
        ))}
      </div>
    </div>
  );
}

function Tile({
  image,
  alt,
  onClick,
  className,
}: {
  image: BraiderPortfolioImage;
  alt: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden bg-border/50 ${className}`}
    >
      <Image
        src={image.url}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover transition-[filter] duration-200 group-hover:brightness-90"
      />
    </button>
  );
}

function Lightbox({
  images,
  index,
  alt,
  dict,
  onClose,
  onNext,
  onPrev,
}: {
  images: BraiderPortfolioImage[];
  index: number;
  alt: (img: BraiderPortfolioImage) => string;
  dict: BraiderDetailDict;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNext();
      if (event.key === "ArrowLeft") onPrev();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, onNext, onPrev]);

  const image = images[index];

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <span className="text-sm font-medium text-white/80">
          {formatTemplate(dict.photoOf, {
            current: index + 1,
            total: images.length,
          })}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.galleryClose}
          className="flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="relative flex-1 px-2 pb-4 sm:px-4">
        <div className="relative h-full w-full">
          <Image
            key={image.id}
            src={image.url}
            alt={alt(image)}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {index > 0 && (
          <button
            type="button"
            onClick={onPrev}
            aria-label={dict.previousPhoto}
            className="absolute top-1/2 left-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 sm:left-4"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        {index < images.length - 1 && (
          <button
            type="button"
            onClick={onNext}
            aria-label={dict.nextPhoto}
            className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 sm:right-4"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {image.caption && (
        <p className="px-4 pb-6 text-center text-sm text-white/70 sm:px-6">
          {image.caption}
        </p>
      )}
    </div>,
    document.body
  );
}
