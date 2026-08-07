"use client";

import { Bell, MessageSquare, LogOut, Menu } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/language/language-switcher";

// Placeholder counts until notifications/messages are wired up to real data.
const NOTIFICATION_COUNT = 3;
const MESSAGE_COUNT = 5;

function IconButton({
  icon: Icon,
  label,
  count,
  onClick,
}: {
  icon: typeof Bell;
  label: string;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex items-center justify-center p-2 text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground"
    >
      <Icon className="size-5" />
      {!!count && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-brand px-1 text-[10px] font-semibold leading-none text-brand-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export function DashboardHeader({
  lang,
  dict,
  themeLabels,
  onMenuClick,
  onLogoutClick,
}: {
  lang: Locale;
  dict: Dictionary["dashboard"]["header"];
  themeLabels: Dictionary["common"]["theme"];
  onMenuClick: () => void;
  onLogoutClick: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-1 border-b border-border bg-surface px-3 sm:gap-2 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="p-2 text-muted-foreground transition-colors hover:bg-border/40 hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5 sm:gap-2">
        <IconButton icon={Bell} label={dict.notifications} count={NOTIFICATION_COUNT} />
        <IconButton icon={MessageSquare} label={dict.messages} count={MESSAGE_COUNT} />

        <div className="mx-1 h-6 w-px bg-border sm:mx-2" />

        <ThemeToggle labels={themeLabels} dropDirection="down" />
        <LanguageSwitcher lang={lang} dropDirection="down" />

        <div className="mx-1 h-6 w-px bg-border sm:mx-2" />

        <IconButton icon={LogOut} label={dict.logout} onClick={onLogoutClick} />
      </div>
    </header>
  );
}
