"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { StarRating } from "./star-rating";
import { braidersApi } from "@/lib/api/braiders-client";
import type { Review } from "@/lib/api/types";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Locale } from "@/lib/i18n";

export function ReviewModal({
  isOpen,
  onClose,
  braiderId,
  accessToken,
  initialReview,
  lang,
  dict,
}: {
  isOpen: boolean;
  onClose: () => void;
  braiderId: string;
  accessToken: string;
  initialReview: Review | null;
  lang: Locale;
  dict: Dictionary["reviews"];
}) {
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState("");

  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setRating(initialReview?.rating ?? 0);
      setComment(
        (lang === "en"
          ? initialReview?.comment_en
          : lang === "fr"
            ? initialReview?.comment_fr
            : initialReview?.comment_de) ?? ""
      );
    }
  }, [isOpen, initialReview, lang]);

  const mutation = useMutation({
    mutationFn: () => {
      if (rating === 0) return Promise.reject(new Error(dict.ratingRequired));
      if (comment.length > 1000) return Promise.reject(new Error(dict.commentTooLong));

      return braidersApi.putMyReview(
        braiderId,
        {
          rating,
          comment: comment.trim() === "" ? null : comment.trim(),
        },
        accessToken,
        lang
      );
    },
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(["my-review", braiderId], updatedReview);
      queryClient.invalidateQueries({ queryKey: ["braider-reviews", braiderId] });
      queryClient.invalidateQueries({ queryKey: ["booking-summary"] });
      
      if (updatedReview.status === "PENDING" && updatedReview.comment_en) {
        toast.success(dict.pendingApproval);
      } else {
        toast.success(dict.submit);
      }
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || dict.failedToSubmit);
    },
  });

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      labelledBy="review-modal-title"
    >
      <div className="flex flex-col gap-6">
        <h2 id="review-modal-title" className="text-xl font-semibold text-foreground">
          {initialReview ? dict.editReview : dict.leaveReview}
        </h2>
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{dict.ratingLabel}</p>
          <StarRating
            rating={rating}
            interactive
            onChange={setRating}
            starClassName="size-8"
            className="gap-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="review-comment" className="text-sm font-semibold text-foreground">
            {dict.commentLabel}
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={dict.commentPlaceholder}
            className="min-h-[120px] resize-none rounded-2xl border border-border bg-input p-4 text-sm text-foreground outline-none placeholder:text-placeholder focus-within:border-brand"
            disabled={mutation.isPending}
            maxLength={1000}
          />
          <div className="flex justify-end">
            <span className={`text-xs ${comment.length > 900 ? "text-red-500" : "text-muted-foreground"}`}>
              {comment.length}/1000
            </span>
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || rating === 0}
          >
            {mutation.isPending ? "..." : dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
