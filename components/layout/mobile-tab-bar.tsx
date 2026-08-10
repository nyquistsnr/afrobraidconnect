"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Bell,
  Compass,
  CalendarCheck2,
  MessageCircle,
  CircleUserRound,
  LogIn,
  LogOut,
  X,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Modal } from "@/components/ui/modal";
import { useChatUnreadTotal } from "@/lib/chat/use-chat-unread-total";
import { useNotificationsUnreadCount } from "@/lib/notifications/use-notifications-unread-count";
import type { NotificationBellDict } from "@/components/notifications/types";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/language/language-switcher";
import {
  LogoutConfirmModal,
  type LogoutModalDict,
} from "@/components/layout/logout-confirm-modal";
import { useLogout } from "@/lib/use-logout";

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
  logoutModal: LogoutModalDict;
}

// Mirrors Airbnb's mobile bottom nav: a few primary destinations plus a
// "Profile" tab that houses account actions and settings that would
// otherwise live in a header hamburger menu — the mobile header itself
// carries only the search bar.
export function MobileTabBar({
  lang,
  dict,
  common,
  notificationsDict,
}: {
  lang: Locale;
  dict: MobileTabBarDict;
  common: Dictionary["common"];
  notificationsDict: NotificationBellDict;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { logout, isLoggingOut } = useLogout(lang);
  const chatUnreadTotal = useChatUnreadTotal();
  const notificationsUnreadCount = useNotificationsUnreadCount(lang);

  const homeHref = `/${lang}`;
  // "Explore" covers the whole browse/discover flow (home, search, braider
  // profiles), not just the exact home route — mirrors how Airbnb keeps its
  // Explore tab highlighted while you're browsing listings.
  const isExploring =
    pathname === homeHref ||
    pathname?.startsWith(`/${lang}/search`) ||
    pathname?.startsWith(`/${lang}/braiders`);
  const bookingsHref = `/${lang}/bookings`;
  const isViewingBookings = pathname?.startsWith(bookingsHref) ?? false;

  const tabs: {
    key: string;
    label: string;
    icon: LucideIcon;
    href: string;
    active: boolean;
    badge?: number;
  }[] = [
    {
      key: "explore",
      label: dict.explore,
      icon: Compass,
      href: homeHref,
      active: isExploring,
    },
    ...(isAuthenticated
      ? [
          {
            key: "bookings",
            label: dict.bookings,
            icon: CalendarCheck2,
            href: bookingsHref,
            active: isViewingBookings,
          },
          {
            key: "messages",
            label: dict.messages,
            icon: MessageCircle,
            href: `/${lang}/chat`,
            active: pathname?.startsWith(`/${lang}/chat`) ?? false,
            badge: chatUnreadTotal,
          },
        ]
      : []),
  ];

  function handleLogoutClick() {
    setProfileOpen(false);
    setLogoutConfirmOpen(true);
  }

  async function handleLogoutConfirm() {
    await logout();
    setLogoutConfirmOpen(false);
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {/* Each tab is an equal flex-1 share of a capped-width row instead of
            a fixed gap between fixed-width items — with up to 4 tabs (signed
            in) plus long localized labels (e.g. German "Nachrichten"), a
            fixed gap-12 row overflows every real phone width and clips the
            last tab off-screen. This can never overflow: N tabs always sum
            to exactly the row width, at any screen size or label length. */}
        <div className="mx-auto flex w-full max-w-md items-stretch">
          {tabs.map(({ key, label, icon: Icon, href, active, badge }) => (
            <Link
              key={key}
              href={href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="relative">
                <Icon className="size-5 shrink-0" strokeWidth={active ? 2.5 : 2} />
                {!!badge && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-brand text-[9px] font-semibold text-brand-foreground">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={profileOpen}
            className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isAuthenticated ? (
              <CircleUserRound className="size-5 shrink-0" />
            ) : (
              <LogIn className="size-5 shrink-0" />
            )}
            <span className="max-w-full truncate">
              {isAuthenticated ? dict.profile : dict.logIn}
            </span>
          </button>
        </div>
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
            href={`/${lang}/esther-ai`}
            onClick={() => setProfileOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
          >
            <Sparkles className="size-4" />
            Esther AI Try-On
          </Link>

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
              <Link
                href={`/${lang}/chat`}
                onClick={() => setProfileOpen(false)}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-border/40"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="size-4" />
                  {dict.messages}
                </span>
                {chatUnreadTotal > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                    {chatUnreadTotal > 9 ? "9+" : chatUnreadTotal}
                  </span>
                )}
              </Link>
              <Link
                href={`/${lang}/notifications`}
                onClick={() => setProfileOpen(false)}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-border/40"
              >
                <span className="flex items-center gap-2">
                  <Bell className="size-4" />
                  {notificationsDict.panelTitle}
                </span>
                {notificationsUnreadCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                    {notificationsUnreadCount > 9 ? "9+" : notificationsUnreadCount}
                  </span>
                )}
              </Link>
              <Link
                href={`/${lang}/profile`}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-border/40"
              >
                <CircleUserRound className="size-4" />
                {dict.profileTitle}
              </Link>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors hover:bg-border/40"
              >
                <LogOut className="size-4" />
                {dict.logOut}
              </button>
            </>
          )}
        </div>
      </Modal>

      <LogoutConfirmModal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={handleLogoutConfirm}
        isLoggingOut={isLoggingOut}
        dict={dict.logoutModal}
      />
    </>
  );
}
