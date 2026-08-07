import { headers } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

// Builds the /login destination for an auth-guard redirect, carrying
// wherever the visitor was trying to go (via proxy.ts's x-pathname/x-search
// headers) so LoginForm can send them back there after signing in.
export async function loginPath(lang: Locale): Promise<string> {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname");
  const search = requestHeaders.get("x-search") ?? "";
  const current = sanitizeCallbackUrl(pathname ? `${pathname}${search}` : null);

  if (!current || current === `/${lang}/login`) return `/${lang}/login`;
  return `/${lang}/login?callbackUrl=${encodeURIComponent(current)}`;
}
