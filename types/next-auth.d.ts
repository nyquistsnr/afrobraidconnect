import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import type { BraiderAuthProfile, UserType } from "@/lib/api/types";

declare module "next-auth" {
  interface User {
    firstName: string;
    lastName: string | null;
    phoneNumber: string | null;
    userType: UserType;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    braider: BraiderAuthProfile | null;
  }

  interface Session {
    user: {
      id: string;
      firstName: string;
      lastName: string | null;
      phoneNumber: string | null;
      userType: UserType;
    } & DefaultSession["user"];
    accessToken: string;
    accessTokenExpires: number;
    braider: BraiderAuthProfile | null;
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    firstName: string;
    lastName: string | null;
    phoneNumber: string | null;
    userType: UserType;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
    braider: BraiderAuthProfile | null;
    error?: "RefreshAccessTokenError";
  }
}
