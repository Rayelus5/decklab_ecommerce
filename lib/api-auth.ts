import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// -------------------------------------------------------
// Tipos
// -------------------------------------------------------
export interface AuthSession {
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

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

/**
 * Verifica que el request tiene sesión activa.
 * Devuelve la sesión o un NextResponse 401.
 */
export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return session as AuthSession;
}

/**
 * Verifica que el request tiene sesión activa con role ADMIN.
 * Devuelve la sesión o un NextResponse 401/403.
 */
export async function requireAdmin(): Promise<AuthSession | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return session as AuthSession;
}

/**
 * Type guard: permite distinguir entre sesión y respuesta de error.
 *
 * Uso:
 *   const result = await requireAdmin();
 *   if (isErrorResponse(result)) return result;
 *   const session = result; // AuthSession garantizado
 */
export function isErrorResponse(
  value: AuthSession | NextResponse
): value is NextResponse {
  return value instanceof NextResponse;
}
