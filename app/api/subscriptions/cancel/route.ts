import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { differenceInMonths } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (!session.user.isPro) {
      return NextResponse.json({ error: "No tienes una suscripción activa" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { proSubscriptionId: true, proSince: true },
    });

    if (!user?.proSubscriptionId) {
      return NextResponse.json({ error: "No se encontró la suscripción" }, { status: 404 });
    }

    // Verificar permanencia mínima (2 meses = 1 ciclo bimestral)
    if (user.proSince) {
      const monthsActive = differenceInMonths(new Date(), user.proSince);
      if (monthsActive < 2) {
        const canCancelAt = new Date(user.proSince);
        canCancelAt.setMonth(canCancelAt.getMonth() + 2);
        return NextResponse.json(
          {
            error: `Permanencia mínima de 2 meses. Puedes cancelar a partir del ${canCancelAt.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}.`,
          },
          { status: 400 }
        );
      }
    }

    // Cancelar al final del período en Stripe (no inmediatamente)
    const subscription = await stripe.subscriptions.update(user.proSubscriptionId, {
      cancel_at_period_end: true,
    });

    const firstItem = subscription.items.data[0];
    const periodEnd = firstItem?.current_period_end
      ? new Date(firstItem.current_period_end * 1000).toISOString()
      : null;

    return NextResponse.json({
      message: "Suscripción cancelada. Mantendrás el acceso PRO hasta el final del período actual.",
      periodEnd,
    });
  } catch (error) {
    console.error("[SUBSCRIPTIONS CANCEL]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
