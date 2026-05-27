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

    if (!session.user.isPro) {
      return NextResponse.json({ error: "No tienes una suscripción activa" }, { status: 400 });
    }

    const { tierId } = await req.json() as { tierId: string };

    const [user, newTier] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { proSubscriptionId: true },
      }),
      prisma.proTier.findUnique({
        where: { id: tierId, isActive: true },
      }),
    ]);

    if (!user?.proSubscriptionId) {
      return NextResponse.json({ error: "No se encontró la suscripción" }, { status: 404 });
    }

    if (!newTier) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    // Obtener suscripción actual de Stripe
    const subscription = await stripe.subscriptions.retrieve(user.proSubscriptionId);
    const currentItem = subscription.items.data[0];

    if (!currentItem) {
      return NextResponse.json({ error: "No se pudo obtener el item de suscripción" }, { status: 500 });
    }

    // Actualizar el item de suscripción con el nuevo precio (proration automática)
    await stripe.subscriptions.update(user.proSubscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newTier.stripePriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    // Actualizar BD
    await prisma.user.update({
      where: { id: session.user.id },
      data: { proTierId: tierId },
    });

    return NextResponse.json({ message: "Plan actualizado correctamente" });
  } catch (error) {
    console.error("[SUBSCRIPTIONS CHANGE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
