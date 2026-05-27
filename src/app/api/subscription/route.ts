import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user) {
            return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
        }

        const body = await req.json();
        const { priceId, tierId } = body;

        if (!priceId || !tierId) {
            return NextResponse.json({ error: "Datos faltantes" }, { status: 400 });
        }

        // Opcional: Verificar si el usuario ya tiene stripeCustomerId
        let stripeCustomerId = user.id; // En un sistema real, buscar en DB o crear en Stripe
        // Simplificación: Stripe Checkout creará el cliente si no le pasamos uno existente.
        // Para producción, deberías guardar el stripeCustomerId en tu tabla User al registrarse.

        const stripeSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId, // El ID de precio recurrente de Stripe (que pusimos en el seed)
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
                tierId: tierId, // Guardamos el ID del nivel para activarlo luego en el webhook
            },
            customer_email: user.email || undefined,
            success_url: `${process.env.NEXTAUTH_URL}/profile?success=subscription`,
            cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("[SUBSCRIPTION_ERROR]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}