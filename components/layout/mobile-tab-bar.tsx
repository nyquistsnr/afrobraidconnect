"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Compass,
  CalendarCheck2,
  MessageCircle,
  CircleUserRound,
  LogIn,
  LogOut,
  Loader2,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Modal } from "@/components/ui/modal";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/language/language-switcher";

export interface MobileTabBarDict {
  explore: string;
  bookings: string;
  messages: string;
  profile: string;
  profileTitle: string;
  appearanceLabel: string;
  languageLabel: string;
  becomeABraider: string;
  signUp: string;
  logIn: string;
  logOut: string;
  helpCenter: string;
}

// Mirrors Airbnb's mobile bottom nav: a few primary destinations plus a
// "Profile" tab that houses account actions and settings that would
// otherwise live in a header hamburger menu — the mobile header itself
// carries only the search bar.
export function MobileTabBar({
  lang,
  dict,
  common,
}: {
  lang: Locale;
  dict: MobileTabBarDict;
  common: Dictionary["common"];
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const tabs = [
    {
      key: "explore",
      label: dict.explore,
      icon: Compass,
      href: `/${lang}`,
      active: true,
    },
    ...(isAuthenticated
      ? ([
          {
            key: "bookings",
            label: dict.bookings,
            icon: CalendarCheck2,
            href: "#",
            active: false,
          },
          {
            key: "messages",
            label: dict.messages,
            icon: MessageCircle,
            href: "#",
            active: false,
          },
        ] as const)
      : []),
  ];

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setLoggingOut(false);
    setProfileOpen(false);
    router.push(`/${lang}`);
    router.refresh();
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-12 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {tabs.map(({ key, label, icon: Icon, href, active }) => (
          <Link
            key={key}
            href={href}
            className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[11px] font-medium transition-colors ${
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={profileOpen}
          className="flex flex-col items-center gap-1 px-4 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {isAuthenticated ? (
            <CircleUserRound className="size-5" />
          ) : (
            <LogIn className="size-5" />
          )}
          {isAuthenticated ? dict.profile : dict.logIn}
        </button>
      </nav>

      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        labelledBy="mobile-profile-title"
        size="lg"
      >
        <div className="flex items-center justify-between">
          <h2
            id="mobile-profile-title"
            className="text-lg font-semibold text-foreground"
          >
            {isAuthenticated
              ? (session?.user?.firstName ?? dict.profileTitle)
              : dict.profileTitle}
          </h2>
          <button
            type="button"
            onClick={() => setProfileOpen(false)}
            aria-label={common.close}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-1">
          {!isAuthenticated && (
            <>
              <Link
                href={`/${lang}/signup`}
                onClick={() => setProfileOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border/40"
              >
                {dict.signUp}
              </Link>
              <Link
                href={`/${lang}/login`}
                onClick={() => setProfileOpen(false)}
                className="rounded-xl px-3 py-3 text-sm text-foreground transition-colors hover:bg-border/40"
              >
                {dict.logIn}
              </Link>

              <div className="my-2 border-t border-border" />
            </>
          )}

          <div className="flex items-center justify-between rounded-xl px-3 py-1">
            <span className="text-sm text-foreground">
              {dict.appearanceLabel}
            </span>
            <ThemeToggle dict={common.theme} closeLabel={common.close} />
          </div>
          <div className="flex items-center justify-between rounded-xl px-3 py-1">
            <span className="text-sm text-foreground">
              {dict.languageLabel}
            </span>
            <LanguageSwitcher
              lang={lang}
              dict={common.language}
              closeLabel={common.close}
            />
          </div>

          <div className="my-2 border-t border-border" />

          <Link
            href="#"
            onClick={() => setProfileOpen(false)}
            className="rounded-xl px-3 py-3 text-sm text-foreground transition-colors hover:bg-border/40"
          >
            {dict.becomeABraider}
          </Link>
          <Link
            href="#"
            onClick={() => setProfileOpen(false)}
            className="rounded-xl px-3 py-3 text-sm text-foreground transition-colors hover:bg-border/40"
          >
            {dict.helpCenter}
          </Link>

          {isAuthenticated && (
            <>
              <div className="my-2 border-t border-border" />
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-border/40 disabled:opacity-60"
              >
                {loggingOut ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                {dict.logOut}
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
