"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Compass,
  CalendarCheck2,
  MessageCircle,
  CircleUserRound,
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

  const tabs = [
    {
      key: "explore",
      label: dict.explore,
      icon: Compass,
      href: `/${lang}`,
      active: true,
    },
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
  ] as const;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {tabs.map(({ key, label, icon: Icon, href, active }) => (
          <Link
            key={key}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
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
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <CircleUserRound className="size-5" />
          {dict.profile}
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
            {dict.profileTitle}
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
        </div>
      </Modal>
    </>
  );
}
