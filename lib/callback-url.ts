// Isomorphic (no next/headers import) so both server guards and client
// components (LoginForm, GoogleSignInButton) can validate a callbackUrl
// before trusting it.

// Only a single-leading-slash relative path is safe to bounce back to after
// login — "//evil.com" is browser shorthand for an absolute protocol-relative
// URL, and anything with "://" is already absolute, so both are rejected to
// avoid turning the login page into an open redirect.
export function sanitizeCallbackUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("/") || url.startsWith("//")) return null;
  if (url.includes("://")) return null;
  return url;
}
