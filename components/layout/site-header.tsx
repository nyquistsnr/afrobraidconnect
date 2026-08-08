"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarCheck2, CircleUserRound, LogOut, Menu } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/language/language-switcher";
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
  initialLocation = null,
  initialStyle = null,
  initialDateRange = {},
}: {
  lang: Locale;
  dict: SiteHeaderDict;
  common: Dictionary["common"];
  initialLocation?: SelectedLocation | null;
  initialStyle?: SelectedStyle | null;
  initialDateRange?: SelectedDateRange;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { status } = useSession();
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
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        className={`sticky top-0 z-50 border-b border-border bg-surface transition-shadow ${
          scrolled ? "shadow-sm" : ""
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
              className="theme-invert h-7 w-auto sm:h-8"
            />
          </Link>

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
          />

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="#"
              className="hidden rounded-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-border/40 lg:block"
            >
              {dict.becomeABraider}
            </Link>

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
                          {dict.profileTitle}
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
                  <li role="none" className="my-2 border-t border-border lg:hidden" />
                  <li role="none" className="lg:hidden">
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

        <div className="border-b border-border px-4 py-3 md:hidden">
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
