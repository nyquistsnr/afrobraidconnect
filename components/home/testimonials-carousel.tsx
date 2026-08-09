"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { formatTemplate } from "@/lib/format-template";
import { motion, AnimatePresence } from "framer-motion";

export interface TestimonialDict {
  name: string;
  roleLabel: string;
  rating: number;
  quote: string;
}

export interface TestimonialsDict {
  badge: string;
  titleBeforeStars: string;
  titleAfterStars: string;
  subtitle: string;
  previousLabel: string;
  nextLabel: string;
  avatarAlt: string;
  reviews: TestimonialDict[];
}

const AVATAR_IMAGES = [
  "/images/Customer.png",
  "/images/stylist.png",
  "/images/customer2.jpg",
  "/images/customerphoto.jpg",
  "/images/hero.png",
];

function StarRating({
  rating,
  variant,
}: {
  rating: number;
  variant: "active" | "muted";
}) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-3.5 transition-colors duration-500 ${
            i < rating
              ? variant === "active"
                ? "fill-brand text-brand"
                : "fill-white text-white"
              : variant === "active"
                ? "fill-transparent text-muted-foreground/40"
                : "fill-transparent text-white/40"
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  review,
  avatarSrc,
  avatarAlt,
  variant,
  className = "",
}: {
  review: TestimonialDict;
  avatarSrc: string;
  avatarAlt: string;
  variant: "active" | "muted";
  className?: string;
}) {
  const isActive = variant === "active";

  return (
    <div
      className={`flex h-full flex-col justify-between rounded-3xl p-6 transition-all duration-500 ease-in-out ${
        isActive
          ? "min-h-[22rem] bg-hero shadow-lg md:min-h-[26rem] md:p-7"
          : "min-h-[19rem] bg-testimonial-muted"
      } ${className}`}
    >
      <div className="flex flex-col gap-3">
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-500 ${
            isActive
              ? "bg-brand text-brand-foreground"
              : "bg-white/25 text-white"
          }`}
        >
          {review.roleLabel}
        </span>
        <StarRating rating={review.rating} variant={variant} />
        <p
          className={`line-clamp-5 text-sm leading-relaxed transition-colors duration-500 ${
            isActive ? "text-foreground" : "text-white"
          }`}
        >
          {review.quote}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/70">
          <Image
            src={avatarSrc}
            alt={avatarAlt}
            fill
            sizes="36px"
            className="object-cover"
          />
        </div>
        <span
          className={`text-sm font-semibold transition-colors duration-500 ${isActive ? "text-foreground" : "text-white"}`}
        >
          {review.name}
        </span>
      </div>
    </div>
  );
}

export function TestimonialsCarousel({ dict }: { dict: TestimonialsDict }) {
  const { reviews } = dict;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const prevIndex = (currentIndex - 1 + reviews.length) % reviews.length;
  const nextIndex = (currentIndex + 1) % reviews.length;

  function goPrev() {
    setDirection(-1);
    setCurrentIndex((i) => (i - 1 + reviews.length) % reviews.length);
  }

  function goNext() {
    setDirection(1);
    setCurrentIndex((i) => (i + 1) % reviews.length);
  }

  function avatarAltFor(review: TestimonialDict) {
    return formatTemplate(dict.avatarAlt, { name: review.name });
  }

  const visibleIndices = [prevIndex, currentIndex, nextIndex];

  return (
    <section className="bg-background px-6 py-14 md:py-20 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full border border-brand px-4 py-1.5 text-sm font-semibold text-brand">
            {dict.badge}
          </span>
          <h2 className="flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {dict.titleBeforeStars}
            <span className="inline-flex gap-0.5 text-brand">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className="size-6 fill-brand text-brand sm:size-7"
                />
              ))}
            </span>
            {dict.titleAfterStars}
          </h2>
          <p className="text-base text-muted-foreground">{dict.subtitle}</p>
        </div>

        <div className="mt-10 md:mt-12">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              type="button"
              aria-label={dict.previousLabel}
              onClick={goPrev}
              className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-hover md:flex"
            >
              <ArrowLeft className="size-4" />
            </button>

            <div className="relative flex w-full flex-1 items-center justify-center gap-5 md:gap-6 min-h-[28rem]">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                {visibleIndices.map((index, i) => {
                  const isCenter = i === 1;
                  return (
                    <motion.div
                      key={reviews[index].name}
                      layout
                      custom={direction}
                      initial={{ 
                        opacity: 0, 
                        x: direction > 0 ? 100 : -100,
                        scale: 0.9 
                      }}
                      animate={{ 
                        opacity: 1, 
                        x: 0,
                        scale: 1 
                      }}
                      exit={{ 
                        opacity: 0, 
                        x: direction > 0 ? -100 : 100,
                        scale: 0.9 
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30,
                        opacity: { duration: 0.2 }
                      }}
                      className={`w-full max-w-sm shrink-0 md:max-w-none md:flex-1 ${
                        isCenter
                          ? "z-10 relative md:-mt-6"
                          : i === 0
                            ? "max-md:absolute max-md:right-[100%] max-md:mr-5 md:relative md:right-auto md:mr-0 z-0"
                            : "max-md:absolute max-md:left-[100%] max-md:ml-5 md:relative md:left-auto md:ml-0 z-0"
                      }`}
                    >
                      <TestimonialCard
                        review={reviews[index]}
                        avatarSrc={AVATAR_IMAGES[index % AVATAR_IMAGES.length]}
                        avatarAlt={avatarAltFor(reviews[index])}
                        variant={isCenter ? "active" : "muted"}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <button
              type="button"
              aria-label={dict.nextLabel}
              onClick={goNext}
              className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-hover md:flex"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 md:hidden">
            <button
              type="button"
              aria-label={dict.previousLabel}
              onClick={goPrev}
              className="flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label={dict.nextLabel}
              onClick={goNext}
              className="flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground transition-colors hover:bg-brand-hover"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
