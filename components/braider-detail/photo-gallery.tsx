"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const showNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : Math.min(i + 1, sorted.length - 1)));
  }, [sorted.length]);
  
  const showPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? i : Math.max(i - 1, 0)));
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const alt = useCallback(
    (img: BraiderPortfolioImage) =>
      img.caption || formatTemplate(dict.imageAlt, { name: businessName }),
    [dict.imageAlt, businessName]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex h-40 w-full items-center justify-center rounded-2xl bg-border/30">
        <div className="flex flex-col items-center gap-2 text-icon-muted">
          <ImageOff className="size-8" />
          <span className="text-sm font-medium">{dict.noPhotos}</span>
        </div>
      </div>
    );
  }

  // Uses dict.showAllPhotos for title if possible, or falls back to "Portfolio"
  const title = dict.showAllPhotos ? dict.showAllPhotos.split(" ")[0] + " Portfolio" : "Portfolio";

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Portfolio
        </h2>
        {sorted.length > 2 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-border/50 text-foreground"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={scrollRight}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-border/50 text-foreground"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {sorted.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative h-48 w-48 sm:h-56 sm:w-56 shrink-0 snap-start overflow-hidden rounded-2xl bg-border/50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            <Image
              src={img.url}
              alt={alt(img)}
              fill
              sizes="(min-width: 640px) 224px, 192px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
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
