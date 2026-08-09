"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Bell,
  CalendarCheck2,
  CircleUserRound,
  LogOut,
  Menu,
  MessageCircle,
  Sparkles,
  Smartphone,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/language/language-switcher";
import { useNotificationsUnreadCount } from "@/lib/notifications/use-notifications-unread-count";
import { useChatUnreadTotal } from "@/lib/chat/use-chat-unread-total";
import { useScrolled } from "@/lib/use-scrolled";
import { SearchBar } from "@/components/search/search-bar";
import { MobileSearch } from "@/components/search/mobile-search-sheet";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import {
  LogoutConfirmModal,
  type LogoutModalDict,
} from "@/components/layout/logout-confirm-modal";
import { useLogout } from "@/lib/use-logout";
import type {
  SelectedLocation,
  SelectedStyle,
  SelectedDateRange,
  SearchDict,
} from "@/components/search/types";
import type { NotificationBellDict } from "@/components/notifications/types";

export interface MobileNavDict {
  explore: string;
  bookings: string;
  messages: string;
  profile: string;
  profileTitle: string;
  appearanceLabel: string;
  languageLabel: string;
}

export interface SiteHeaderDict {
  logoAlt: string;
  searchLocationLabel: string;
  searchLocationPlaceholder: string;
  searchStyleLabel: string;
  searchStylePlaceholder: string;
  searchDateLabel: string;
  searchDatePlaceholder: string;
  searchButtonLabel: string;
  startSearch: string;
  becomeABraider: string;
  signUp: string;
  logIn: string;
  logOut: string;
  downloadApp: string;
  myBookings: string;
  helpCenter: string;
  menuLabel: string;
  search: SearchDict;
  mobileNav: MobileNavDict;
  logoutModal: LogoutModalDict;
}

export function SiteHeader({
  lang,
  dict,
  common,
  notificationsDict,
  initialLocation = null,
  initialStyle = null,
  initialDateRange = {},
  searchDocked,
  onSearchActiveChange,
  searchActivateSignal,
}: {
  lang: Locale;
  dict: SiteHeaderDict;
  common: Dictionary["common"];
  notificationsDict: NotificationBellDict;
  initialLocation?: SelectedLocation | null;
  initialStyle?: SelectedStyle | null;
  initialDateRange?: SelectedDateRange;
  // Home-page-only: when provided, the header's search bar is hidden
  // (crossfaded away) whenever searchDocked is explicitly false, instead of
  // always showing — every other page leaves these undefined and renders
  // exactly as before. Presence of this prop (isLandingSearch below) also
  // switches the header to the hero's bg-hero color instead of bg-surface,
  // constantly (not just pre-scroll), so it reads as one continuous band
  // with the hero section beneath it.
  searchDocked?: boolean;
  onSearchActiveChange?: (open: boolean) => void;
  searchActivateSignal?: number;
}) {
  const scrolled = useScrolled();
  const isLandingSearch = searchDocked !== undefined;
  // Rather than fading the wrapper in the instant searchDocked flips true,
  // wait one frame first: `scrolled` (and therefore SearchBar's own
  // expanded/collapsed shape) may be changing at the very same moment
  // (scroll-triggered docking), and fading opacity while the content is
  // simultaneously snapping shape reads as a glitchy "flash". Letting the
  // shape settle first (while still fully hidden), then fading the now-
  // stable content in on the next frame, avoids that entirely.
  const [searchVisible, setSearchVisible] = useState(() => searchDocked !== false);
  useEffect(() => {
    if (!isLandingSearch) return;
    if (!searchDocked) {
      // Immediate hide is intentional (no rAF): there's no shape-change
      // risk on the way out, only on the way in (see comment above).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchVisible(false);
      return;
    }
    const timer = setTimeout(() => setSearchVisible(true), 0);
    return () => clearTimeout(timer);
  }, [isLandingSearch, searchDocked]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const chatUnreadTotal = useChatUnreadTotal();
  const notificationsUnreadCount = useNotificationsUnreadCount();
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { logout, isLoggingOut } = useLogout(lang);

  function handleLogoutClick() {
    setMenuOpen(false);
    setLogoutConfirmOpen(true);
  }

  async function handleLogoutConfirm() {
    await logout();
    setLogoutConfirmOpen(false);
  }

  const [location, setLocation] = useState<SelectedLocation | null>(
    initialLocation || null
  );
  const [style, setStyle] = useState<SelectedStyle | null>(initialStyle || null);
  const [dateRange, setDateRange] =
    useState<SelectedDateRange>(initialDateRange);

  // Sync state when props change from URL updates (like reverse geocoding on map drag)
  useEffect(() => {
    setLocation(initialLocation || null);
  }, [
    initialLocation?.label,
    initialLocation?.lat,
    initialLocation?.lng,
    initialLocation?.countryCode,
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isLandingSearch 
            ? scrolled 
              ? "bg-surface/80 backdrop-blur-md border-b border-border/50 shadow-sm" 
              : "bg-hero border-b border-transparent"
            : scrolled 
              ? "bg-surface/80 backdrop-blur-md border-b border-border/50 shadow-sm" 
              : "bg-surface border-b border-border"
        }`}
      >
        <div
          className={`mx-auto hidden max-w-[1760px] items-center justify-between gap-2 px-4 transition-[height] duration-200 sm:px-6 md:flex lg:px-10 ${
            scrolled ? "h-20" : "h-24"
          }`}
        >
          <Link
            href={`/${lang}`}
            aria-label={dict.logoAlt}
            className="flex shrink-0 items-center"
          >
            <Image
              src="/logo/logo.webp"
              alt={dict.logoAlt}
              width={256}
              height={65}
              priority
              className="theme-invert h-9 w-auto sm:h-11"
            />
          </Link>

          <div
            className={`header-search-slot flex-1 min-w-0 ${
              isLandingSearch && !searchVisible ? "header-search-slot-hidden" : ""
            }`}
            inert={isLandingSearch && !searchVisible}
          >
            <SearchBar
              lang={lang}
              scrolled={scrolled}
              dict={dict}
              location={location}
              onLocationChange={setLocation}
              style={style}
              onStyleChange={setStyle}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onActiveChange={onSearchActiveChange}
              activateSignal={searchActivateSignal}
              disableEntranceAnimation={isLandingSearch}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-1 sm:gap-2 lg:flex">
              <ThemeToggle dict={common.theme} closeLabel={common.close} />
              <LanguageSwitcher
                lang={lang}
                dict={common.language}
                closeLabel={common.close}
              />
            </div>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={dict.menuLabel}
                className="flex items-center gap-2 rounded-full border border-border py-1.5 pr-2.5 pl-3 transition-shadow hover:shadow-md"
              >
                <Menu className="size-4 text-foreground" />
                {isAuthenticated && session?.user?.firstName ? (
                  <span className="text-sm font-semibold text-foreground px-1">
                    {session.user.firstName}
                  </span>
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-border text-muted-foreground">
                    <CircleUserRound className="size-5" />
                  </div>
                )}
              </button>

              {menuOpen && (
                <ul
                  role="menu"
                  className="absolute top-full right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-surface py-2 shadow-lg"
                >
                  {isAuthenticated && (
                    <>
                      <li role="none">
                        <Link
                          role="menuitem"
                          href={`/${lang}/profile`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-border/40"
                        >
                          <CircleUserRound className="size-4" />
                          {session?.user?.firstName ?? dict.mobileNav.profileTitle}
                        </Link>
                      </li>
                      <li role="none">
                        <Link
                          role="menuitem"
                          href={`/${lang}/bookings`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-border/40"
                        >
                          <CalendarCheck2 className="size-4" />
                          {dict.myBookings}
                        </Link>
                      </li>
                      <li role="none">
                        <Link
                          role="menuitem"
                          href={`/${lang}/chat`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-border/40"
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle className="size-4" />
                            {dict.mobileNav.messages}
                          </span>
                          {chatUnreadTotal > 0 && (
                            <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
                              {chatUnreadTotal > 9 ? "9+" : chatUnreadTotal}
                            </span>
                          )}
                        </Link>
                      </li>
                      <li role="none">
                        <Link
                          role="menuitem"
                          href={`/${lang}/notifications`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-border/40"
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
                      </li>
                    </>
                  )}
                  {!isAuthenticated && (
                    <>
                      <li role="none">
                        <Link
                          role="menuitem"
                          href={`/${lang}/signup`}
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-border/40"
                        >
                          {dict.signUp}
                        </Link>
                      </li>
                      <li role="none">
                        <Link
                          role="menuitem"
                          href={`/${lang}/login`}
                          onClick={() => setMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-border/40"
                        >
                          {dict.logIn}
                        </Link>
                      </li>
                    </>
                  )}
                  <li role="none" className="my-2 border-t border-border" />
                  <li role="none" className="lg:hidden">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm text-foreground">
                        {dict.mobileNav.appearanceLabel}
                      </span>
                      <ThemeToggle dict={common.theme} closeLabel={common.close} />
                    </div>
                  </li>
                  <li role="none" className="lg:hidden">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-sm text-foreground">
                        {dict.mobileNav.languageLabel}
                      </span>
                      <LanguageSwitcher
                        lang={lang}
                        dict={common.language}
                        closeLabel={common.close}
                      />
                    </div>
                  </li>
                  <li role="none" className="my-2 border-t border-border" />
                  <li role="none">
                    <Link
                      role="menuitem"
                      href={`/${lang}/esther-ai`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/10 transition-colors"
                    >
                      <Sparkles className="size-4" />
                      Esther AI Try-On
                    </Link>
                  </li>
                  <li role="none">
                    <Link
                      role="menuitem"
                      href={`/${lang}/download-app`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/10 transition-colors"
                    >
                      <Smartphone className="size-4" />
                      {dict.downloadApp}
                    </Link>
                  </li>
                  <li role="none">
                    <Link
                      role="menuitem"
                      href="#"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-border/40"
                    >
                      {dict.becomeABraider}
                    </Link>
                  </li>
                  <li role="none">
                    <Link
                      role="menuitem"
                      href="#"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-foreground hover:bg-border/40"
                    >
                      {dict.helpCenter}
                    </Link>
                  </li>
                  {isAuthenticated && (
                    <>
                      <li role="none" className="my-2 border-t border-border" />
                      <li role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogoutClick}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground hover:bg-border/40"
                        >
                          <LogOut className="size-4" />
                          {dict.logOut}
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div
          className={`px-4 py-3 md:hidden ${
            isLandingSearch ? "" : "border-b border-border"
          }`}
        >
          <MobileSearch
            lang={lang}
            dict={{
              searchLocationLabel: dict.searchLocationLabel,
              searchStyleLabel: dict.searchStyleLabel,
              searchDateLabel: dict.searchDateLabel,
              startSearch: dict.startSearch,
              searchButtonLabel: dict.searchButtonLabel,
              closeLabel: common.close,
              clearAllLabel: dict.search.clearAll,
              search: dict.search,
            }}
            location={location}
            onLocationChange={setLocation}
            style={style}
            onStyleChange={setStyle}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </header>

      <MobileTabBar
        lang={lang}
        dict={{
          ...dict.mobileNav,
          becomeABraider: dict.becomeABraider,
          signUp: dict.signUp,
          logIn: dict.logIn,
          logOut: dict.logOut,
          helpCenter: dict.helpCenter,
          logoutModal: dict.logoutModal,
        }}
        common={common}
        notificationsDict={notificationsDict}
      />

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
