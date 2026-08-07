"use client";

import { ToastContainer } from "react-toastify";
import { useTheme } from "@/components/theme/theme-provider";

// Keeps toast styling in sync with the app's own theme system (data-theme
// attribute), rather than react-toastify's default light-only styling.
export function AppToastContainer() {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      position="top-right"
      theme={resolvedTheme}
      autoClose={5000}
      newestOnTop
    />
  );
}
