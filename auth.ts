import NextAuth, { CredentialsSignin, type User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { ApiError, authApi } from "@/lib/api/auth-client";
import type { AuthTokenResponse } from "@/lib/api/types";
import { defaultLocale, hasLocale } from "@/lib/i18n";

class LoginError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

function toAuthUser(tokens: AuthTokenResponse): User {
  return {
    id: tokens.id,
    email: tokens.email,
    name: [tokens.first_name, tokens.last_name].filter(Boolean).join(" "),
    firstName: tokens.first_name,
    lastName: tokens.last_name,
    phoneNumber: tokens.phone_number,
    userType: tokens.user_type,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessTokenExpires: Date.now() + tokens.expires_in * 1000,
    braider: tokens.braider,
  };
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const refreshed = await authApi.refresh(token.refreshToken);
    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: {},
        password: {},
        rememberMe: {},
        lang: {},
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;

        if (typeof email !== "string" || typeof password !== "string") {
          throw new LoginError("VALIDATION_ERROR");
        }

        const lang =
          typeof credentials?.lang === "string" && hasLocale(credentials.lang)
            ? credentials.lang
            : defaultLocale;

        try {
          const tokens = await authApi.login(
            {
              email,
              password,
              remember_me: credentials?.rememberMe === "true",
            },
            lang,
          );
          return toAuthUser(tokens);
        } catch (error) {
          throw new LoginError(
            error instanceof ApiError ? error.code : "UNKNOWN_ERROR",
          );
        }
      },
    }),
    Credentials({
      id: "google",
      name: "Google",
      credentials: {
        providerToken: {},
        lang: {},
      },
      authorize: async (credentials) => {
        const providerToken = credentials?.providerToken;

        if (typeof providerToken !== "string") {
          throw new LoginError("VALIDATION_ERROR");
        }

        const lang =
          typeof credentials?.lang === "string" && hasLocale(credentials.lang)
            ? credentials.lang
            : defaultLocale;

        try {
          const tokens = await authApi.socialLogin(
            "google",
            {
              provider_token: providerToken,
              user_type: "CUSTOMER",
            },
            lang,
          );
          return toAuthUser(tokens);
        } catch (error) {
          throw new LoginError(
            error instanceof ApiError ? error.code : "UNKNOWN_ERROR",
          );
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        token.firstName = session.firstName ?? token.firstName;
        token.lastName = session.lastName ?? token.lastName;
        token.phoneNumber = session.phoneNumber ?? token.phoneNumber;
      }

      if (user) {
        return {
          ...token,
          id: user.id as string,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          userType: user.userType,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: user.accessTokenExpires,
          braider: user.braider,
        };
      }

      if (Date.now() < token.accessTokenExpires - 120_000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.phoneNumber = token.phoneNumber;
      session.user.userType = token.userType;
      session.accessToken = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.braider = token.braider;
      session.error = token.error;
      return session;
    },
  },
});
