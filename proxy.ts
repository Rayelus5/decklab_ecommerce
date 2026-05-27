import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  "/products",
  "/cart",
  "/checkout",
  "/order-success",
  "/pricing",
  "/profile",
];

// Rutas exclusivas para administradores
const ADMIN_ROUTES = ["/admin"];

// Rutas de autenticación (redirigir si ya está logueado)
const AUTH_ROUTES = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: typeof req.auth };
  const pathname = nextUrl.pathname;

  const isAuthenticated = !!session;
  const userRole = (session?.user as Record<string, unknown>)?.role as string | undefined;
  const isTelegramMember = (session?.user as Record<string, unknown>)?.isTelegramMember as boolean | undefined;
  const isAdmin = userRole === "ADMIN";

  // --- Rutas de autenticación (redirigir si ya logueado) ---
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/products", nextUrl));
    }
    return NextResponse.next();
  }

  // --- Rutas de administración ---
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl)
      );
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // --- Rutas protegidas (requieren login + Telegram membership) ---
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, nextUrl)
      );
    }

    // Verificar membresía de Telegram (excepto admin)
    if (!isAdmin && !isTelegramMember) {
      return NextResponse.redirect(
        new URL("/acceso-privado", nextUrl)
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  // Aplicar middleware a todas las rutas excepto recursos estáticos y API routes
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/webhooks).*)",
  ],
};
