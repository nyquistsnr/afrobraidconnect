"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LogoutConfirmModal } from "@/components/dashboard/logout-confirm-modal";

export function DashboardShell({
  lang,
  dict,
  themeLabels,
  logoutSuccessMessage,
  userName,
  userLogo,
  children,
}: {
  lang: Locale;
  dict: Dictionary["dashboard"];
  themeLabels: Dictionary["common"]["theme"];
  logoutSuccessMessage: string;
  userName: string;
  userLogo: string | null;
  children: React.ReactNode;
}) {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleConfirmLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success(logoutSuccessMessage);
      router.push(`/${lang}/login`);
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  }, [lang, logoutSuccessMessage, router]);

  return (
    <div className="flex h-screen">
      <Sidebar
        lang={lang}
        dict={dict.sidebar}
        userName={userName}
        userLogo={userLogo}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogoutClick={() => setLogoutModalOpen(true)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          lang={lang}
          dict={dict.header}
          themeLabels={themeLabels}
          onMenuClick={() => setSidebarOpen(true)}
          onLogoutClick={() => setLogoutModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6">
          {children}
        </main>
      </div>

      <LogoutConfirmModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
        dict={dict.logoutModal}
      />
    </div>
  );
}
