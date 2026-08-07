"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  LogOut, 
  X,
  CreditCard,
  Settings,
  MessageSquare,
  Clock,
  MapPin,
  Scissors,
  ListChecks
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";

export function Sidebar({
  lang,
  dict,
  userName,
  userLogo,
  open,
  onClose,
  onLogoutClick,
}: {
  lang: Locale;
  dict: Dictionary["dashboard"]["sidebar"] & { 
    payment?: string; 
    settings?: string; 
    chat?: string; 
    availability?: string; 
    location?: string; 
    serviceStyle?: string; 
    onboardingStatus?: string; 
  };
  userName: string;
  userLogo: string | null;
  open: boolean;
  onClose: () => void;
  onLogoutClick: () => void;
}) {
  const pathname = usePathname();

  // Only relevant on mobile, where the sidebar is an off-canvas drawer —
  // at the lg breakpoint it's always visible and this has no effect.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const navItems = [
    {
      href: `/${lang}/dashboard`,
      label: dict.dashboard,
      icon: LayoutDashboard,
      active: pathname === `/${lang}/dashboard`,
    },
    {
      href: `/${lang}/dashboard/bookings`,
      label: dict.bookings,
      icon: CalendarCheck,
      active: pathname === `/${lang}/dashboard/bookings`,
    },
    {
      href: `/${lang}/dashboard/payment`,
      label: dict.payment || "Payment",
      icon: CreditCard,
      active: pathname === `/${lang}/dashboard/payment`,
    },
    {
      href: `/${lang}/dashboard/settings`,
      label: dict.settings || "Settings",
      icon: Settings,
      active: pathname === `/${lang}/dashboard/settings`,
    },
    {
      href: `/${lang}/dashboard/chat`,
      label: dict.chat || "Chat",
      icon: MessageSquare,
      active: pathname === `/${lang}/dashboard/chat`,
    },
    {
      href: `/${lang}/dashboard/availability`,
      label: dict.availability || "Availability",
      icon: Clock,
      active: pathname === `/${lang}/dashboard/availability`,
    },
    {
      href: `/${lang}/dashboard/location`,
      label: dict.location || "Location",
      icon: MapPin,
      active: pathname === `/${lang}/dashboard/location`,
    },
    {
      href: `/${lang}/dashboard/service-style`,
      label: dict.serviceStyle || "Service Style",
      icon: Scissors,
      active: pathname === `/${lang}/dashboard/service-style`,
    },
    {
      href: `/${lang}/dashboard/onboarding-status`,
      label: dict.onboardingStatus || "Onboarding Status",
      icon: ListChecks,
      active: pathname === `/${lang}/dashboard/onboarding-status`,
    },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <Image
            src="/logo/logo.webp"
            alt="Afrobraid Connect"
            width={126}
            height={32}
            className="theme-invert"
            priority
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-border/40 hover:text-foreground"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-4">
          <Link
            href={`/${lang}/dashboard/profile`}
            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
              pathname === `/${lang}/dashboard/profile`
                ? "bg-border/80 text-foreground"
                : "hover:bg-border/40"
            }`}
          >
            <Image
              src={userLogo || "/images/profile.jpg"}
              alt={userName}
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-full object-cover ring-1 ring-border"
            />
            <span className="truncate text-sm font-semibold text-foreground">
              {userName}
            </span>
          </Link>

          <button
            type="button"
            onClick={onLogoutClick}
            className="mt-1 flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
          >
            <LogOut className="size-5" />
            {dict.logout}
          </button>
        </div>
      </aside>
    </>
  );
}
