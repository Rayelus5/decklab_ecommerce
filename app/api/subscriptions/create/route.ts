import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (session.user.isPro) {
      return NextResponse.json(
        { error: "Ya tienes una suscripción activa. Usa el endpoint de cambio de plan." },
        { status: 400 }
      );
    }

    const { tierId } = await req.json() as { tierId: string };

    const tier = await prisma.proTier.findUnique({
      where: { id: tierId, isActive: true },
    });

    if (!tier) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Crear Stripe Checkout Session para suscripción
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: tier.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/pricing?subscribed=1`,
      cancel_url: `${appUrl}/pricing`,
      customer_email: session.user.email,
      subscription_data: {
        metadata: {
          userId: session.user.id,
          tierId: tier.id,
        },
      },
      metadata: {
        userId: session.user.id,
        tierId: tier.id,
        type: "subscription",
      },
      locale: "es",
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("[SUBSCRIPTIONS CREATE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
