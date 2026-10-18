"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Download,
  EllipsisVertical,
  Ellipsis,
  Globe,
  Heart,
  MessageCircle,
  Share,
  SquarePlus,
  X,
  Zap,
} from "lucide-react";
import {
  OPEN_INSTALL_EVENT,
  runNativeInstall,
  useInstallEnvironment,
  useNativeInstallEvent,
  type InstallEnvironment,
} from "@/lib/pwa/install";

export interface InstallAppDict {
  appName: string;
  appTagline: string;
  title: string;
  subtitle: string;
  benefitFast: string;
  benefitBookings: string;
  benefitLight: string;
  install: string;
  showHow: string;
  openInBrowser: string;
  notNow: string;
  close: string;
  back: string;
  gotIt: string;
  free: string;
  noStore: string;
  stepsTitleIos: string;
  stepsTitleAndroid: string;
  stepsTitleInApp: string;
  iosStepShare: string;
  iosStepShareHintSafari: string;
  iosStepShareHintOther: string;
  iosStepAdd: string;
  iosStepAddHint: string;
  iosStepConfirm: string;
  iosStepConfirmHint: string;
  androidStepMenu: string;
  androidStepMenuHint: string;
  androidStepInstall: string;
  androidStepConfirm: string;
  androidStepConfirmHint: string;
  inAppStepMenu: string;
  inAppStepMenuHint: string;
  inAppStepOpen: string;
  inAppStepOpenHint: string;
  inAppStepInstall: string;
  copyLink: string;
  linkCopied: string;
  successTitle: string;
  successBody: string;
}

// --- When to show it automatically --------------------------------------
// Never interrupt the first seconds of a visit, auth flows or checkout.
// Wait until the visitor is engaged (a returning visit, or a second page),
// back off for a week after "Not now", and stop asking after three
// dismissals (the menu entry still opens it on demand).
const KEY_INSTALLED = "afrobraid:pwa-installed";
const KEY_DISMISSED_AT = "afrobraid:install-dismissed-at";
const KEY_DISMISS_COUNT = "afrobraid:install-dismiss-count";
const KEY_VISITS = "afrobraid:visit-count";
const SESSION_COUNTED = "afrobraid:visit-counted";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DISMISSALS = 3;
const BLOCKED_PATHS = /\/(login|signup|forgot-password|reset-password|verify-email|book)(\/|$)/;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode) — the prompt just won't remember.
  }
}

function countVisit(): number {
  let visits = Number(read(KEY_VISITS) ?? 0);
  try {
    if (!sessionStorage.getItem(SESSION_COUNTED)) {
      sessionStorage.setItem(SESSION_COUNTED, "1");
      visits += 1;
      write(KEY_VISITS, String(visits));
    }
  } catch {
    // Ignore.
  }
  return visits;
}

function isSnoozed(): boolean {
  if (read(KEY_INSTALLED)) return true;
  if (Number(read(KEY_DISMISS_COUNT) ?? 0) >= MAX_DISMISSALS) return true;
  const dismissedAt = Number(read(KEY_DISMISSED_AT) ?? 0);
  return Date.now() - dismissedAt < SNOOZE_MS;
}

// --- Small building blocks ----------------------------------------------

function AppIcon({ size = 64 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 overflow-hidden rounded-[22%] bg-white shadow-[0_8px_24px_-6px] shadow-brand/50 ring-1 ring-black/5"
      style={{ width: size, height: size }}
    >
      {/* Plain img: tiny static asset, must show instantly (no lazy load). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/favicon_io/android-chrome-192x192.png"
        alt=""
        width={size}
        height={size}
        loading="eager"
        className="size-full object-cover"
      />
    </span>
  );
}

function Benefit({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        {icon}
      </span>
      <span className="text-sm text-foreground">{children}</span>
    </li>
  );
}

// A step with a little mock of the exact control to tap, so people match
// what they see on their own screen instead of parsing instructions.
function Step({
  n,
  title,
  hint,
  visual,
}: {
  n: number;
  title: string;
  hint?: string;
  visual: ReactNode;
}) {
  return (
    <li className="install-step flex items-start gap-3" style={{ animationDelay: `${n * 90}ms` }}>
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      <span className="shrink-0">{visual}</span>
    </li>
  );
}

function MockButton({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <span
      className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface text-[#0a84ff] shadow-sm ${
        wide ? "px-3 text-xs font-semibold" : "w-10"
      }`}
    >
      {children}
    </span>
  );
}

// Bouncing arrow pointing at where the browser's own control sits on
// screen (outside our page): Safari's toolbar is at the bottom on iPhone;
// iPad Safari and Chrome on iOS put Share at the top right.
function BrowserPointer({ position }: { position: "bottom" | "top-right" }) {
  if (position === "bottom") {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-[101] flex justify-center">
        <span className="install-bounce-down flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xl">
          <ArrowDown className="size-5" strokeWidth={2.5} />
        </span>
      </div>
    );
  }
  return (
    <div className="pointer-events-none fixed top-[max(10px,env(safe-area-inset-top))] right-4 z-[101]">
      <span className="install-bounce-up flex size-11 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-xl">
        <ArrowUp className="size-5" strokeWidth={2.5} />
      </span>
    </div>
  );
}

type View = "intro" | "steps" | "success";

export function InstallAppPrompt({ dict }: { dict: InstallAppDict }) {
  const env = useInstallEnvironment();
  const nativeEvent = useNativeInstallEvent();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("intro");
  const [installing, setInstalling] = useState(false);
  const [copied, setCopied] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const pageViews = useRef(0);

  const canShowAtAll = (e: InstallEnvironment | null) =>
    !!e && !e.isStandalone && (e.platform !== "desktop" || !!nativeEvent);

  // On-demand opening (menu item / download page) skips the timing rules.
  useEffect(() => {
    function onOpen() {
      setView("intro");
      setOpen(true);
    }
    window.addEventListener(OPEN_INSTALL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_INSTALL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    pageViews.current += 1;
  }, [pathname]);

  // Automatic timing.
  useEffect(() => {
    if (!env || !canShowAtAll(env) || open) return;
    if (BLOCKED_PATHS.test(pathname)) return;
    if (isSnoozed()) return;
    const visits = countVisit();
    const engaged = visits >= 2 || pageViews.current >= 2;
    const delay = engaged ? 8_000 : 25_000;
    let timer: number;
    function tryShow() {
      // Don't stack on top of another dialog or the searching overlay.
      if (document.querySelector('[aria-modal="true"], .searching-overlay')) {
        timer = window.setTimeout(tryShow, 10_000);
        return;
      }
      setView("intro");
      setOpen(true);
    }
    timer = window.setTimeout(tryShow, delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, nativeEvent, pathname, open]);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (view !== "success") {
      write(KEY_DISMISSED_AT, String(Date.now()));
      write(KEY_DISMISS_COUNT, String(Number(read(KEY_DISMISS_COUNT) ?? 0) + 1));
    }
  }, [view]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => primaryRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, view, dismiss]);

  // Installed from the browser's own UI while this was open.
  useEffect(() => {
    if (!open) return;
    const onInstalled = () => setView("success");
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [open]);

  if (!open || !env || typeof document === "undefined") return null;

  const { platform, isIPad } = env;

  async function handlePrimary() {
    if (nativeEvent && (platform === "android" || platform === "desktop")) {
      setInstalling(true);
      try {
        const accepted = await runNativeInstall(nativeEvent);
        if (accepted) setView("success");
      } finally {
        setInstalling(false);
      }
      return;
    }
    setView("steps");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the steps still explain the menu route.
    }
  }

  const primaryLabel =
    nativeEvent && (platform === "android" || platform === "desktop")
      ? dict.install
      : platform === "in-app"
        ? dict.openInBrowser
        : dict.showHow;

  const pointer =
    view === "steps" && platform === "ios-safari"
      ? isIPad
        ? "top-right"
        : "bottom"
      : view === "steps" && platform === "ios-other"
        ? "top-right"
        : null;
  // With the arrow pointing at Safari's bottom toolbar, lift the sheet to
  // the top of the screen so it doesn't sit on top of the arrow.
  const anchorTop = pointer === "bottom";

  const stepsTitle =
    platform === "in-app"
      ? dict.stepsTitleInApp
      : platform === "android"
        ? dict.stepsTitleAndroid
        : dict.stepsTitleIos;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex justify-center sm:items-center sm:p-4 ${
        anchorTop ? "items-start" : "items-end"
      }`}
    >
      <div
        className="install-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden
      />
      {pointer && <BrowserPointer position={pointer} />}

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-title"
        className={`relative w-full overflow-hidden bg-surface shadow-2xl sm:max-w-[420px] sm:rounded-[28px] ${
          anchorTop
            ? "install-sheet-down rounded-b-[28px] pt-[env(safe-area-inset-top)]"
            : "install-sheet-up rounded-t-[28px] pb-[env(safe-area-inset-bottom)]"
        }`}
      >
        {/* Warm brand glow behind the header. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/15 to-transparent"
          aria-hidden
        />
        <div className="relative flex max-h-[92dvh] flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-2 sm:px-7 sm:pt-6">
          {!anchorTop && <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-foreground/15 sm:hidden" aria-hidden />}

          <div className="flex items-center justify-between">
            {view === "steps" ? (
              <button
                type="button"
                onClick={() => setView("intro")}
                className="-ml-2 flex items-center gap-1 rounded-full px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-border/40"
              >
                <ArrowLeft className="size-4" />
                {dict.back}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={dismiss}
              aria-label={dict.close}
              className="-mr-1 flex size-9 items-center justify-center rounded-full bg-border/40 text-foreground transition-colors hover:bg-border/70"
            >
              <X className="size-4" />
            </button>
          </div>

          {view === "intro" && (
            <div key="intro" className="install-view">
              <div className="flex flex-col items-center text-center">
                <AppIcon />
                <p className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {dict.appName} · {dict.appTagline}
                </p>
                <h2
                  id="install-app-title"
                  className="mt-1.5 text-[22px] leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-2xl"
                >
                  {dict.title}
                </h2>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">
                  {dict.subtitle}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                    {dict.free}
                  </span>
                  <span className="rounded-full bg-border/50 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                    {dict.noStore}
                  </span>
                </div>
              </div>

              <ul className="mt-5 flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-background/60 p-3.5">
                <Benefit icon={<Zap className="size-4" />}>{dict.benefitFast}</Benefit>
                <Benefit icon={<MessageCircle className="size-4" />}>{dict.benefitBookings}</Benefit>
                <Benefit icon={<Heart className="size-4" />}>{dict.benefitLight}</Benefit>
              </ul>

            </div>
          )}

          {view === "steps" && (
            <div key="steps" className="install-view">
              <div className="mt-1 flex items-center gap-3">
                <AppIcon size={44} />
                <h2 id="install-app-title" className="text-lg leading-snug font-semibold text-foreground">
                  {stepsTitle}
                </h2>
              </div>

              <ol className="mt-5 flex flex-col gap-4">
                {platform === "in-app" ? (
                  <>
                    <Step
                      n={1}
                      title={dict.inAppStepMenu}
                      hint={dict.inAppStepMenuHint}
                      visual={
                        <MockButton>
                          <Ellipsis className="size-5 text-foreground" />
                        </MockButton>
                      }
                    />
                    <Step
                      n={2}
                      title={dict.inAppStepOpen}
                      hint={dict.inAppStepOpenHint}
                      visual={
                        <MockButton wide>
                          <Globe className="size-4" />
                        </MockButton>
                      }
                    />
                    <Step
                      n={3}
                      title={dict.inAppStepInstall}
                      visual={
                        <MockButton>
                          <SquarePlus className="size-5" />
                        </MockButton>
                      }
                    />
                  </>
                ) : platform === "android" ? (
                  <>
                    <Step
                      n={1}
                      title={dict.androidStepMenu}
                      hint={dict.androidStepMenuHint}
                      visual={
                        <MockButton>
                          <EllipsisVertical className="size-5 text-foreground" />
                        </MockButton>
                      }
                    />
                    <Step
                      n={2}
                      title={dict.androidStepInstall}
                      visual={
                        <MockButton>
                          <Download className="size-5 text-foreground" />
                        </MockButton>
                      }
                    />
                    <Step
                      n={3}
                      title={dict.androidStepConfirm}
                      hint={dict.androidStepConfirmHint}
                      visual={<AppIcon size={40} />}
                    />
                  </>
                ) : (
                  <>
                    <Step
                      n={1}
                      title={dict.iosStepShare}
                      hint={
                        platform === "ios-safari" && !isIPad
                          ? dict.iosStepShareHintSafari
                          : dict.iosStepShareHintOther
                      }
                      visual={
                        <MockButton>
                          <Share className="size-5" />
                        </MockButton>
                      }
                    />
                    <Step
                      n={2}
                      title={dict.iosStepAdd}
                      hint={dict.iosStepAddHint}
                      visual={
                        <MockButton>
                          <SquarePlus className="size-5 text-foreground" />
                        </MockButton>
                      }
                    />
                    <Step
                      n={3}
                      title={dict.iosStepConfirm}
                      hint={dict.iosStepConfirmHint}
                      visual={<AppIcon size={40} />}
                    />
                  </>
                )}
              </ol>

            </div>
          )}

          {view === "success" && (
            <div key="success" className="install-view flex flex-col items-center py-4 text-center">
              <span className="install-pop flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
                <Check className="size-8" strokeWidth={3} />
              </span>
              <h2 id="install-app-title" className="mt-4 text-xl font-semibold text-foreground">
                {dict.successTitle}
              </h2>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{dict.successBody}</p>
              <button
                ref={primaryRef}
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background"
              >
                {dict.gotIt}
              </button>
            </div>
          )}
        </div>

        {/* Actions stay pinned at the bottom so the main button is always
            on screen, even on short phones (iPhone SE) or big text sizes. */}
        {view !== "success" && (
          <div className="shrink-0 border-t border-border/60 bg-surface px-5 pt-3 pb-4 sm:px-7 sm:pb-6">
            {view === "intro" ? (
              <>
              <button
                ref={primaryRef}
                type="button"
                onClick={handlePrimary}
                disabled={installing}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-semibold text-brand-foreground shadow-[0_10px_24px_-10px] shadow-brand transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-70"
              >
                {platform === "in-app" ? (
                  <Globe className="size-5" />
                ) : nativeEvent && platform !== "ios-safari" && platform !== "ios-other" ? (
                  <Download className="size-5" />
                ) : (
                  <SquarePlus className="size-5" />
                )}
                {primaryLabel}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="mt-1 h-11 w-full rounded-2xl text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {dict.notNow}
              </button>
              </>
            ) : (
              <>
              {platform === "in-app" && (
                <button
                  type="button"
                  onClick={copyLink}
                  className="mb-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
                >
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  {copied ? dict.linkCopied : dict.copyLink}
                </button>
              )}

              <button
                ref={primaryRef}
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background transition-transform active:scale-[0.98]"
              >
                {dict.gotIt}
              </button>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>,
    document.body
  );
}
