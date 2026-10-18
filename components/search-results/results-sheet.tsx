"use client";

import { useRef, type ReactNode, type RefObject } from "react";

// Velocity (px/ms) above which a flick decides the snap regardless of how
// far the sheet travelled — a quick swipe should always "throw" it.
const FLICK_VELOCITY = 0.45;
const TAP_SLOP_PX = 6;

// Phone layout for the results list (Airbnb/Uber-style): a draggable sheet
// over a live map. Expanded = full list; collapsed = just a peek strip (the
// handle + results heading) above the tab bar, with the map fully usable.
// From lg up it renders as a plain side column and none of this applies.
//
// The resting position lives in a CSS variable (--sheet-y) so a drag can
// move the sheet frame-by-frame through the DOM without re-rendering React.
export function ResultsSheet({
  expanded,
  onExpandedChange,
  scrollRef,
  handleLabel,
  className = "",
  children,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  handleLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const peekProbeRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    startY: number;
    startOffset: number;
    maxOffset: number;
    lastY: number;
    lastT: number;
    velocity: number;
    moved: boolean;
  } | null>(null);

  const restingY = expanded ? "0px" : "calc(100% - var(--sheet-peek))";

  function settle(nextExpanded: boolean) {
    const sheet = sheetRef.current;
    if (sheet) {
      delete sheet.dataset.dragging;
      // Set explicitly: if the snap lands back on the current state React
      // won't rewrite the (unchanged) style, leaving the dragged px value.
      sheet.style.setProperty(
        "--sheet-y",
        nextExpanded ? "0px" : "calc(100% - var(--sheet-peek))"
      );
    }
    if (nextExpanded !== expanded) onExpandedChange(nextExpanded);
  }

  function onPointerDown(event: React.PointerEvent) {
    const sheet = sheetRef.current;
    const probe = peekProbeRef.current;
    if (!sheet || !probe || window.matchMedia("(min-width: 1024px)").matches) return;
    const maxOffset = Math.max(0, sheet.offsetHeight - probe.offsetHeight);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: expanded ? 0 : maxOffset,
      maxOffset,
      lastY: event.clientY,
      lastT: performance.now(),
      velocity: 0,
      moved: false,
    };
  }

  function onPointerMove(event: React.PointerEvent) {
    const state = drag.current;
    const sheet = sheetRef.current;
    if (!state || !sheet || state.pointerId !== event.pointerId) return;
    const dy = event.clientY - state.startY;
    if (!state.moved && Math.abs(dy) < TAP_SLOP_PX) return;
    if (!state.moved) {
      state.moved = true;
      sheet.dataset.dragging = "true";
    }
    // Rubber-band slightly past either end instead of a hard stop.
    let offset = state.startOffset + dy;
    if (offset < 0) offset = offset / 4;
    if (offset > state.maxOffset) offset = state.maxOffset + (offset - state.maxOffset) / 4;
    sheet.style.setProperty("--sheet-y", `${offset}px`);

    const now = performance.now();
    const dt = Math.max(1, now - state.lastT);
    state.velocity = (event.clientY - state.lastY) / dt;
    state.lastY = event.clientY;
    state.lastT = now;
  }

  function onPointerUp(event: React.PointerEvent) {
    const state = drag.current;
    drag.current = null;
    if (!state || state.pointerId !== event.pointerId) return;
    if (!state.moved) {
      settle(!expanded);
      return;
    }
    const offset = state.startOffset + (event.clientY - state.startY);
    if (state.velocity > FLICK_VELOCITY) settle(false);
    else if (state.velocity < -FLICK_VELOCITY) settle(true);
    else settle(offset < state.maxOffset / 2);
  }

  return (
    <div
      ref={sheetRef}
      style={{ ["--sheet-y" as string]: restingY }}
      onClick={() => {
        // Collapsed, the whole peek strip is a tap target to bring the list up.
        if (!expanded) onExpandedChange(true);
      }}
      className={`flex min-h-0 flex-col max-lg:absolute max-lg:inset-0 max-lg:z-20 max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:bg-background max-lg:shadow-[0_-10px_40px_-8px_rgba(0,0,0,0.35)] max-lg:[transform:translate3d(0,var(--sheet-y),0)] max-lg:transition-transform max-lg:duration-[420ms] max-lg:ease-[cubic-bezier(0.22,1,0.36,1)] max-lg:data-[dragging]:transition-none ${className}`}
    >
      <div
        ref={peekProbeRef}
        className="pointer-events-none invisible absolute h-[var(--sheet-peek)] w-0"
        aria-hidden
      />
      <button
        type="button"
        aria-label={handleLabel}
        aria-expanded={expanded}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={(event) => event.stopPropagation()}
        className="flex h-7 w-full shrink-0 touch-none items-center justify-center lg:hidden"
      >
        <span className="h-1.5 w-11 rounded-full bg-foreground/20" />
      </button>
      <div
        ref={scrollRef}
        data-results-scroll
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          expanded ? "" : "max-lg:overflow-hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
