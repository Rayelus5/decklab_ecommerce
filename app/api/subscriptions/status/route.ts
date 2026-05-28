import { NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/subscriptions/status
 * Devuelve el estado PRO actual del usuario directamente desde la BD
 * (no desde el JWT cacheado). Usado por el componente SubscriptionSuccess
 * para saber cuándo el webhook ha activado el PRO.
 */
export async function GET() {
  const sessionOrError = await requireAuth();
  if (isErrorResponse(sessionOrError)) return sessionOrError;
  const session = sessionOrError;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPro: true, proTierId: true },
  });

  return NextResponse.json({
    isPro: user?.isPro ?? false,
    proTierId: user?.proTierId ?? null,
  });
}
