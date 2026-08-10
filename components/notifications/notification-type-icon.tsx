import {
  Banknote,
  Bell,
  KeyRound,
  LogIn,
  MessageCircle,
  ShieldAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/lib/api/types";

// Same soft opacity-tinted chip approach as BookingStatusBadge — reads the
// same in light and dark mode without needing a dark: variant.
const ICON_BY_TYPE: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  PAYMENT_DEPOSIT_SUCCEEDED: { icon: Banknote, className: "bg-emerald-500/10 text-emerald-600" },
  PAYMENT_FULL_SUCCEEDED: { icon: Banknote, className: "bg-emerald-500/10 text-emerald-600" },
  PAYMENT_BALANCE_SUCCEEDED: { icon: Banknote, className: "bg-emerald-500/10 text-emerald-600" },
  CHAT_NEW_MESSAGE: { icon: MessageCircle, className: "bg-brand/10 text-brand" },
  CHAT_MESSAGE_FLAGGED: { icon: ShieldAlert, className: "bg-amber-500/10 text-amber-600" },
  PROFILE_UPDATED: { icon: UserRound, className: "bg-border/60 text-muted-foreground" },
  PASSWORD_CHANGED: { icon: KeyRound, className: "bg-amber-500/10 text-amber-600" },
  NEW_LOGIN: { icon: LogIn, className: "bg-blue-500/10 text-blue-600" },
};

const DEFAULT_ICON = { icon: Bell, className: "bg-border/60 text-muted-foreground" };

// The API doc treats any type outside the current enum as "render
// generically" since the set is expected to grow — falls back to a plain
// bell chip instead of throwing/crashing on an unrecognized type.
export function NotificationTypeIcon({ type }: { type: string }) {
  const { icon: Icon, className } =
    ICON_BY_TYPE[type as NotificationType] ?? DEFAULT_ICON;
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}
