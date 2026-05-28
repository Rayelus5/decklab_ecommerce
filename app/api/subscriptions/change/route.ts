import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/subscriptions/change
 *
 * Inicia el proceso de cambio de plan PRO.
 * Crea una nueva sesión de Stripe Checkout para el nuevo tier.
 * El tier anterior se cancela automáticamente cuando el webhook confirma
 * el pago del nuevo (handleSubscriptionCheckoutCompleted).
 *
 * NO actualiza la BD directamente — la actualización ocurre vía webhook.
 */
export async function POST(req: NextRequest) {
  const sessionOrError = await requireAuth();
  if (isErrorResponse(sessionOrError)) return sessionOrError;
  const session = sessionOrError;

  if (!session.user.isPro) {
    return NextResponse.json(
      { error: "No tienes una suscripción activa" },
      { status: 400 }
    );
  }

  let tierId: string;
  try {
    const body = await req.json() as { tierId: string };
    tierId = body.tierId;
  } catch {
    return NextResponse.json({ error: "Request inválido" }, { status: 400 });
  }

  if (!tierId) {
    return NextResponse.json({ error: "tierId es obligatorio" }, { status: 400 });
  }

  // No cambiar al mismo tier
  if (tierId === session.user.proTierId) {
    return NextResponse.json(
      { error: "Ya estás suscrito a este plan" },
      { status: 400 }
    );
  }

  const [user, newTier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { proSubscriptionId: true, stripeCustomerId: true, email: true },
    }),
    prisma.proTier.findUnique({
      where: { id: tierId, isActive: true },
      select: { id: true, name: true, stripePriceId: true },
    }),
  ]);

  if (!user?.proSubscriptionId) {
    return NextResponse.json(
      { error: "No se encontró tu suscripción activa en Stripe" },
      { status: 404 }
    );
  }

  if (!newTier) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Crear nueva sesión de Checkout para el nuevo tier.
  // El webhook cancelará la suscripción anterior cuando ésta se active.
  const stripeSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: newTier.stripePriceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?subscribed=1`,
    cancel_url: `${appUrl}/pricing`,
    // Reutilizar el customer de Stripe si existe (evita pedir tarjeta de nuevo)
    ...(user.stripeCustomerId
      ? { customer: user.stripeCustomerId }
      : { customer_email: user.email ?? session.user.email }),
    subscription_data: {
      metadata: {
        userId: session.user.id,
        tierId: newTier.id,
        // ID de la suscripción anterior — el webhook la cancelará al activar la nueva
        oldSubscriptionId: user.proSubscriptionId,
      },
    },
    metadata: {
      userId: session.user.id,
      tierId: newTier.id,
      oldSubscriptionId: user.proSubscriptionId,
    },
    locale: "es",
  });

  if (!stripeSession.url) {
    return NextResponse.json(
      { error: "No se pudo crear la sesión de pago" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: stripeSession.url });
}
