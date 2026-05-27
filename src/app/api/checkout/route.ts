import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover", // Usa la última versión disponible o la que te sugiera VSCode
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { items, shippingRateId, address } = body;

        if (!items || !shippingRateId || !address) {
            return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
        }

        // 1. Validar Tarifa de Envío
        const shippingRate = await prisma.shippingRate.findUnique({
            where: { id: shippingRateId },
        });
        if (!shippingRate) {
            return NextResponse.json({ error: "Tarifa de envío inválida" }, { status: 400 });
        }

        // 2. Reconstruir items con precios REALES de la DB
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        let dbOrderItems = []; // Para guardar referencia luego si queremos

        for (const item of items) {
            const variant = await prisma.productVariant.findUnique({
                where: { id: item.variantId },
                include: { product: true },
            });

            if (!variant) continue;

            // Lógica PRO: Si es PRO y el producto tiene precio PRO, usamos ese
            const isPro = session.user.isPro;
            const priceToUse = (isPro && variant.pricePro) ? variant.pricePro : variant.price;

            // Convertir a céntimos para Stripe (euros * 100)
            const unitAmount = Math.round(Number(priceToUse) * 100);

            line_items.push({
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: `${variant.product.title} (${variant.title || variant.sku})`,
                        images: item.image ? [item.image] : [],
                        metadata: {
                            sku: variant.sku,
                            variantId: variant.id
                        }
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            });

            dbOrderItems.push({
                variantId: variant.id,
                quantity: item.quantity,
                price: priceToUse
            });
        }

        // 3. Añadir el Envío como un item más
        line_items.push({
            price_data: {
                currency: "eur",
                product_data: {
                    name: `Envío: ${shippingRate.name}`,
                },
                unit_amount: Math.round(Number(shippingRate.price) * 100),
            },
            quantity: 1,
        });

        // 4. Crear Sesión de Stripe
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // Añade "paypal" aquí si lo configuras luego
            mode: "payment",
            customer_email: session.user.email || undefined,
            line_items,
            metadata: {
                userId: session.user.id,
                address: JSON.stringify(address), // Guardamos la dirección en metadatos para el webhook
                shippingRateId: shippingRate.id
            },
            success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/checkout?canceled=true`,
        });

        return NextResponse.json({ url: stripeSession.url });

    } catch (error) {
        console.error("[CHECKOUT_ERROR]", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}