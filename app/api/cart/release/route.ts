import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/cart/release
 *
 * Libera la(s) reserva(s) de stock de sesiones de checkout abandonadas del usuario.
 * Se llama cuando el usuario vacía el carrito o elimina todos los items.
 *
 * Body (opcional): { sessionId: string } → libera esa sesión concreta.
 * Sin body           → libera todas las sesiones no convertidas del usuario.
 */
export async function POST(req: NextRequest) {
  const sessionOrError = await requireAuth();
  if (isErrorResponse(sessionOrError)) return sessionOrError;
  const session = sessionOrError;

  let sessionId: string | null = null;
  try {
    const body = await req.json() as { sessionId?: string };
    sessionId = body.sessionId ?? null;
  } catch {
    // Body vacío → liberar todas
  }

  const where = sessionId
    ? { stripeSessionId: sessionId, userId: session.user.id, convertedAt: null }
    : { userId: session.user.id, convertedAt: null };

  const carts = await prisma.abandonedCart.findMany({
    where,
    select: { id: true, stripeSessionId: true, cartItems: true },
  });

  if (carts.length === 0) {
    return NextResponse.json({ released: 0 });
  }

  let released = 0;

  for (const cart of carts) {
    const items = cart.cartItems as Array<{ variantId: string; quantity: number }>;

    // 1. Liberar reservas (idempotente con GREATEST)
    try {
      await prisma.$transaction(
        items.map((item) =>
          prisma.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
            WHERE id = ${item.variantId}
          `
        )
      );
    } catch (err) {
      console.error("[CART RELEASE] Error releasing stock for cart", cart.id, err);
      continue;
    }

    // 2. Expirar sesión de Stripe (no bloqueante — puede que ya esté expirada)
    stripe.checkout.sessions.expire(cart.stripeSessionId).catch(() => {});

    // 3. Eliminar el registro (el webhook de expiración usará GREATEST si llega tarde)
    await prisma.abandonedCart.delete({ where: { id: cart.id } }).catch(() => {});

    released++;
  }

  return NextResponse.json({ released });
}
