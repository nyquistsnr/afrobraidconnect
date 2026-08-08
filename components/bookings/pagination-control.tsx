"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatTemplate } from "@/lib/format-template";
import type { PaginationMeta } from "@/lib/api/types";
import type { BookingsListDict } from "@/components/bookings/types";

export function BookingsPaginationControl({
  pagination,
  onChangePage,
  dict,
}: {
  pagination: PaginationMeta;
  onChangePage: (page: number) => void;
  dict: BookingsListDict;
}) {
  if (pagination.total_pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 border-t border-border pt-6">
      <button
        type="button"
        disabled={!pagination.has_previous}
        onClick={() => onChangePage(pagination.page - 1)}
        aria-label={dict.previousPage}
        className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-border/40 disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="text-sm text-muted-foreground">
        {formatTemplate(dict.pageOf, {
          current: pagination.page,
          total: pagination.total_pages,
        })}
      </span>
      <button
        type="button"
        disabled={!pagination.has_next}
        onClick={() => onChangePage(pagination.page + 1)}
        aria-label={dict.nextPage}
        className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-border/40 disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
