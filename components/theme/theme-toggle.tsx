"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { themes, type Theme } from "@/lib/theme";
import { OptionPickerModal } from "@/components/ui/option-picker-modal";

const icons: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export interface ThemeDict {
  modalTitle: string;
  modalDescription?: string;
  light: { label: string; description: string };
  dark: { label: string; description: string };
  system: { label: string; description: string };
}

export function ThemeToggle({
  dict,
  closeLabel,
}: {
  dict: ThemeDict;
  closeLabel: string;
}) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Intentional: flips exactly once, after hydration, so this component's
    // first client render matches the server before switching to the real value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // The server always renders "system" (it has no access to localStorage).
  // Defer to the real value only after mount so hydration doesn't mismatch.
  const activeTheme = mounted ? theme : "system";
  const CurrentIcon = icons[activeTheme];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={dict[activeTheme].label}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-muted-foreground hover:bg-border/40 hover:text-foreground"
      >
        <CurrentIcon className="size-4" />
      </button>

      <OptionPickerModal
        open={open}
        onClose={() => setOpen(false)}
        title={dict.modalTitle}
        description={dict.modalDescription}
        closeLabel={closeLabel}
        value={activeTheme}
        onChange={setTheme}
        options={themes.map((option) => {
          const Icon = icons[option];
          return {
            value: option,
            label: dict[option].label,
            description: dict[option].description,
            leading: <Icon className="size-5" />,
          };
        })}
      />
    </>
  );
}
