import { NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/subscriptions/portal
 *
 * Crea una sesión del Customer Portal de Stripe y devuelve la URL de redirección.
 * El usuario puede cancelar, cambiar de plan o actualizar su método de pago directamente en Stripe.
 */
export async function POST() {
  const sessionOrError = await requireAuth();
  if (isErrorResponse(sessionOrError)) return sessionOrError;
  const session = sessionOrError;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, isPro: true },
  });

  if (!user?.isPro) {
    return NextResponse.json(
      { error: "No tienes una suscripción activa" },
      { status: 403 }
    );
  }

  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "No hay cliente de Stripe asociado a tu cuenta" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/profile`,
  });

  return NextResponse.json({ url: portalSession.url });
}
