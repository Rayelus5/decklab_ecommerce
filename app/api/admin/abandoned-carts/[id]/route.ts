import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendAbandonedCartEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/abandoned-carts/[id]
 * Libera el stock reservado y elimina el carrito abandonado.
 */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  const cart = await prisma.abandonedCart.findUnique({
    where: { id },
    select: { id: true, stripeSessionId: true, cartItems: true, convertedAt: true },
  });

  if (!cart) {
    return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
  }

  if (cart.convertedAt) {
    return NextResponse.json(
      { error: "Este carrito ya fue convertido en pedido — no se puede eliminar" },
      { status: 409 }
    );
  }

  const items = cart.cartItems as Array<{ variantId: string; quantity: number }>;

  // 1. Liberar reservas (GREATEST para idempotencia)
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
    console.error("[ADMIN CART DELETE] Error releasing stock:", err);
    return NextResponse.json(
      { error: "Error al liberar el stock reservado" },
      { status: 500 }
    );
  }

  // 2. Expirar sesión de Stripe (no bloqueante)
  stripe.checkout.sessions.expire(cart.stripeSessionId).catch(() => {});

  // 3. Eliminar registro
  await prisma.abandonedCart.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

/**
 * POST /api/admin/abandoned-carts/[id]/email → en route separado
 * Se mantiene aquí como acción alternativa si se prefiere una ruta plana.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  const cart = await prisma.abandonedCart.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      cartItems: true,
      subtotal: true,
      convertedAt: true,
      recoveryEmailSentAt: true,
    },
  });

  if (!cart) {
    return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
  }

  if (cart.convertedAt) {
    return NextResponse.json(
      { error: "Este carrito ya fue convertido en pedido" },
      { status: 409 }
    );
  }

  if (cart.recoveryEmailSentAt) {
    return NextResponse.json(
      { error: "El email de recuperación ya fue enviado" },
      { status: 409 }
    );
  }

  await sendAbandonedCartEmail(
    cart.userId,
    cart.cartItems,
    Number(cart.subtotal)
  );

  await prisma.abandonedCart.update({
    where: { id },
    data: { recoveryEmailSentAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
