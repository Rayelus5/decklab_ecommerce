import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAbandonedCartEmail } from "@/lib/email";

// Vercel Cron Jobs envía automáticamente el header Authorization: Bearer <CRON_SECRET>
// En desarrollo puedes llamarlo con: curl -H "Authorization: Bearer <tu_secret>" http://localhost:3000/api/cron/cleanup-reserved-stock

export async function GET(req: NextRequest) {
  // Verificar el secreto (Vercel lo inyecta automáticamente desde CRON_SECRET)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Umbral: sesiones creadas hace más de 25 horas (Stripe expira a las 24h por defecto)
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000);

  // Carritos abandonados sin convertir más antiguos que el umbral
  const orphanedCarts = await prisma.abandonedCart.findMany({
    where: {
      convertedAt: null,
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      userId: true,
      cartItems: true,
      subtotal: true,
      recoveryEmailSentAt: true,
    },
  });

  if (orphanedCarts.length === 0) {
    console.log("[CRON] No orphaned carts to clean up");
    return NextResponse.json({ cleaned: 0, emailsSent: 0 });
  }

  let cleaned = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  for (const cart of orphanedCarts) {
    try {
      const items = cart.cartItems as Array<{
        variantId: string;
        quantity: number;
        pricePaid: number;
      }>;

      // Liberar reservedStock de forma idempotente (GREATEST evita negativos)
      // Si el webhook ya lo procesó, reservedStock ya es 0 → GREATEST(0, 0-n) = 0, sin daño
      await prisma.$transaction(
        items.map((item) =>
          prisma.$executeRaw`
            UPDATE "ProductVariant"
            SET "reservedStock" = GREATEST(0, "reservedStock" - ${item.quantity})
            WHERE id = ${item.variantId}
          `
        )
      );

      cleaned++;

      // Enviar email de recuperación si aún no se envió
      if (!cart.recoveryEmailSentAt) {
        try {
          await sendAbandonedCartEmail(cart.userId, cart.cartItems, Number(cart.subtotal));
          await prisma.abandonedCart.update({
            where: { id: cart.id },
            data: { recoveryEmailSentAt: new Date() },
          });
          emailsSent++;
        } catch (emailErr) {
          console.error(`[CRON] Error sending recovery email for cart ${cart.id}:`, emailErr);
          errors.push(`email:${cart.id}`);
        }
      }
    } catch (err) {
      console.error(`[CRON] Error cleaning cart ${cart.id}:`, err);
      errors.push(`stock:${cart.id}`);
    }
  }

  console.log(`[CRON] Cleanup done — carts: ${cleaned}, emails: ${emailsSent}, errors: ${errors.length}`);

  return NextResponse.json({
    cleaned,
    emailsSent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
