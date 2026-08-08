// NEXT_PUBLIC_API_BASE_URL already includes the /api/v1 prefix (e.g.
// http://localhost:8000/api/v1) — the realtime channel lives at /ws off the
// same host, just over ws(s) instead of http(s). The access token travels as
// a query param since browsers can't set custom headers on a WS handshake.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export function buildRealtimeSocketUrl(accessToken: string): string | null {
  if (!API_BASE) return null;

  let wsBase: string;
  try {
    const url = new URL(API_BASE);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    wsBase = url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }

  return `${wsBase}/ws?token=${encodeURIComponent(accessToken)}`;
}
