"use client";

import { useEffect, useRef, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { themes, type Theme } from "@/lib/theme";

const icons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle({
  labels,
  dropDirection = "up",
}: {
  labels: Record<Theme, string>;
  dropDirection?: "up" | "down";
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intentional: flips exactly once, after hydration, so this component's
    // first client render matches the server before switching to the real value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // The server always renders "system" (it has no access to localStorage).
  // Defer to the real value only after mount so hydration doesn't mismatch.
  const activeTheme = mounted ? theme : "system";
  const CurrentIcon = icons[activeTheme];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={labels[activeTheme]}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-muted-foreground hover:bg-border/40 hover:text-foreground"
      >
        <CurrentIcon className="size-4" />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`absolute right-0 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg ${
            dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {themes.map((option) => {
            const Icon = icons[option];
            return (
              <li key={option}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option === activeTheme}
                  onClick={() => {
                    setTheme(option);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-border/40 ${
                    option === activeTheme
                      ? "font-semibold text-brand"
                      : "text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {labels[option]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
