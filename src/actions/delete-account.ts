"use server";

import { auth, signOut } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

export async function deleteAccount() {
    const session = await auth();
    if (!session?.user) return { error: "No autorizado" };

    const userId = session.user.id;

    try {
        // 1. Obtener datos del usuario para Stripe
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true }
        });

        // 2. Si tiene ID de Stripe, borrar el cliente en Stripe
        // Esto cancela suscripciones y borra tarjetas guardadas en Stripe
        if (user?.stripeCustomerId) {
            try {
                await stripe.customers.del(user.stripeCustomerId);
            } catch (stripeError) {
                console.error("Error borrando cliente en Stripe (continuando con DB):", stripeError);
                // No detenemos el proceso si Stripe falla (ej. si ya no existía), pero lo logueamos
            }
        }

        // 3. Borrar usuario de la Base de Datos
        // Nota: Si tu Schema tiene "onDelete: Cascade" en las relaciones, esto borrará todo.
        // Si no, necesitamos borrar manualmente los pedidos primero. 
        // Para asegurar, usamos una transacción que limpia dependencias críticas.
        await prisma.$transaction(async (tx) => {
            // Borrar direcciones
            await tx.address.deleteMany({ where: { userId } });

            // Borrar sesiones/cuentas (NextAuth)
            await tx.session.deleteMany({ where: { userId } });
            await tx.account.deleteMany({ where: { userId } });

            // Opcional: Borrar pedidos (O mantenerlos anonimizados si es requisito legal)
            // Aquí los borramos para limpieza total
            const userOrders = await tx.order.findMany({ where: { userId }, select: { id: true } });
            for (const order of userOrders) {
                // Borrar items de cada orden
                await tx.orderItem.deleteMany({ where: { orderId: order.id } });
                // Borrar envío
                await tx.shipment.deleteMany({ where: { orderId: order.id } });
            }
            await tx.order.deleteMany({ where: { userId } });

            // Finalmente, borrar el usuario
            await tx.user.delete({ where: { id: userId } });
        });

    } catch (error) {
        console.error("Error eliminando cuenta:", error);
        return { error: "Error interno al eliminar la cuenta." };
    }

    // 4. Cerrar sesión (esto redirige internamente)
    await signOut({ redirectTo: "/" });
}