import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verifySessionToken } from "@/app/api/auth/telegram/route";

// -------------------------------------------------------
// Configuración NextAuth v5
// -------------------------------------------------------
export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  // trustHost: permite que NextAuth confíe en los headers X-Forwarded-Host
  // que Vercel/proxies añaden. Sin esto → MissingCSRF en Google OAuth.
  trustHost: true,

  // basePath no es necesario cambiar (por defecto /api/auth),
  // pero sí es crítico que AUTH_URL esté en las env vars de Vercel.
  // NextAuth v5 usa AUTH_URL (no NEXTAUTH_URL) para anclar CSRF y cookies.

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    // --- Credenciales (email + contraseña) ---
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { proTier: true },
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) return null;

        if (user.isBlocked) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isPro: user.isPro,
          proTierId: user.proTierId,
          isTelegramMember: user.isTelegramMember,
          telegramId: user.telegramId,
        };
      },
    }),

    // --- Google OAuth ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // --- Telegram (token de un solo uso generado por /api/auth/telegram) ---
    Credentials({
      id: "telegram",
      name: "Telegram",
      credentials: {
        userId: { type: "text" },
        sessionToken: { type: "text" },
      },
      async authorize(credentials) {
        const userId = credentials?.userId as string | undefined;
        const token = credentials?.sessionToken as string | undefined;

        if (!userId || !token) return null;

        // Verificar que el token HMAC es válido y no ha expirado
        if (!verifySessionToken(userId, token)) return null;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { proTier: true },
        });

        if (!user || user.isBlocked || !user.isTelegramMember) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isPro: user.isPro,
          proTierId: user.proTierId,
          isTelegramMember: user.isTelegramMember,
          telegramId: user.telegramId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Primera vez que se genera el token (login)
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role as string;
        token.isPro = (user as Record<string, unknown>).isPro as boolean;
        token.proTierId = (user as Record<string, unknown>).proTierId as string | null;
        token.isTelegramMember = (user as Record<string, unknown>).isTelegramMember as boolean;
        token.telegramId = (user as Record<string, unknown>).telegramId as string | null;
        token.lastRefreshed = Date.now();
        return token;
      }

      // Helper: re-fetch desde BD y actualizar token
      const refreshFromDb = async () => {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            isPro: true,
            proTierId: true,
            isTelegramMember: true,
            telegramId: true,
            isBlocked: true,
          },
        });
        if (!dbUser) return token;
        if (dbUser.isBlocked) return {}; // invalidar token → fuerza logout
        token.role = dbUser.role;
        token.isPro = dbUser.isPro;
        token.proTierId = dbUser.proTierId;
        token.isTelegramMember = dbUser.isTelegramMember;
        token.telegramId = dbUser.telegramId;
        token.lastRefreshed = Date.now();
        return token;
      };

      // Actualizar datos si se hace update de sesión explícito
      if (trigger === "update" && session) {
        return await refreshFromDb();
      }

      // Refresh periódico: si el token tiene más de 5 minutos, re-fetch silencioso.
      // Esto garantiza que cambios del admin (activar PRO, bloquear usuario…)
      // se propaguen sin que el usuario tenga que cerrar sesión.
      const lastRefreshed = (token.lastRefreshed as number) ?? 0;
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (Date.now() - lastRefreshed > FIVE_MINUTES) {
        return await refreshFromDb();
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isPro = token.isPro as boolean;
        session.user.proTierId = token.proTierId as string | null;
        session.user.isTelegramMember = token.isTelegramMember as boolean;
        session.user.telegramId = token.telegramId as string | null;
      }
      return session;
    },

    async signIn({ user, account }) {
      // Para OAuth (Google), verificar que no esté bloqueado
      if (account?.provider !== "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { isBlocked: true },
        });
        if (dbUser?.isBlocked) return false;
      }
      return true;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// -------------------------------------------------------
// Extensión de tipos para incluir campos personalizados
// -------------------------------------------------------
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      isPro: boolean;
      proTierId: string | null;
      isTelegramMember: boolean;
      telegramId: string | null;
    };
  }

  interface User {
    role?: string;
    isPro?: boolean;
    proTierId?: string | null;
    isTelegramMember?: boolean;
    telegramId?: string | null;
  }
}
