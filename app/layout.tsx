import type { Metadata } from "next";
import { Geist, Geist_Mono, Fira_Sans } from "next/font/google";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";
import { GoogleMapsProvider } from "@/components/maps/google-maps-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { InlineScript } from "@/components/theme/inline-script";
import { AppToastContainer } from "@/components/toast-container";
import { QueryProvider } from "@/lib/query-provider";
import { themeInitScript } from "@/lib/theme";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Afrobraid Connect",
  description: "Connecting clients with professional hair braiders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.className} ${firaSans.className} ${geistMono.className} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeInitScript} />
      </head>
      <body className="min-h-full flex flex-col">
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <SessionProvider>
          <ThemeProvider>
            <QueryProvider>
              <GoogleMapsProvider
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
              >
                {children}
              </GoogleMapsProvider>
              <AppToastContainer />
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
