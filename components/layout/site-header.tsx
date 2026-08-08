"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Menu } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/language/language-switcher";

export interface SiteHeaderDict {
  logoAlt: string;
  searchLocationLabel: string;
  searchLocationPlaceholder: string;
  searchStyleLabel: string;
  searchStylePlaceholder: string;
  searchDateLabel: string;
  searchDatePlaceholder: string;
  startSearch: string;
  becomeABraider: string;
  signUp: string;
  logIn: string;
  helpCenter: string;
  menuLabel: string;
}

export function SiteHeader({
  lang,
  dict,
  themeLabels,
}: {
  lang: Locale;
  dict: SiteHeaderDict;
  themeLabels: Record<"light" | "dark" | "system", string>;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <header
      className={`sticky top-0 z-50 border-b border-border bg-surface transition-shadow ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1760px] items-center justify-between gap-2 px-4 transition-[height] duration-200 sm:px-6 lg:px-10 ${
          scrolled ? "h-[72px]" : "h-20"
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

        <div className="hidden flex-1 justify-center md:flex">
          {scrolled ? (
            <button
              type="button"
              className="flex h-12 items-center gap-3 rounded-full border border-border bg-surface px-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Search className="size-4" />
              </span>
              <span className="text-sm font-medium text-foreground">
                {dict.startSearch}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="flex h-14 items-center divide-x divide-border overflow-hidden rounded-full border border-border bg-surface transition-shadow hover:shadow-md"
            >
              <span className="px-6 py-2.5 text-left">
                <span className="block text-xs font-semibold text-foreground">
                  {dict.searchLocationLabel}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {dict.searchLocationPlaceholder}
                </span>
              </span>
              <span className="hidden px-6 py-2.5 text-left lg:block">
                <span className="block text-xs font-semibold text-foreground">
                  {dict.searchStyleLabel}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {dict.searchStylePlaceholder}
                </span>
              </span>
              <span className="flex items-center gap-3 py-2 pr-2 pl-6">
                <span className="hidden text-left lg:block">
                  <span className="block text-xs font-semibold text-foreground">
                    {dict.searchDateLabel}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {dict.searchDatePlaceholder}
                  </span>
                </span>
                <span className="flex size-8 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <Search className="size-4" />
                </span>
              </span>
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="#"
            className="hidden rounded-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-border/40 lg:block"
          >
            {dict.becomeABraider}
          </Link>

          <ThemeToggle labels={themeLabels} dropDirection="down" />
          <LanguageSwitcher lang={lang} dropDirection="down" />

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
                <li role="none" className="my-2 border-t border-border" />
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
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3 md:hidden">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-full border border-border bg-surface px-4 py-3 shadow-sm"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <Search className="size-4" />
          </span>
          <span className="flex flex-col text-left">
            <span className="text-sm font-semibold text-foreground">
              {dict.searchLocationLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              {dict.startSearch}
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}
