import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover", // Usa la misma versión que en checkout
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature") as string;

    let event: Stripe.Event;

    try {
        // 1. Verificar firma de seguridad
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook signature verification failed.", err);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    // 2. Manejar el evento "checkout.session.completed"
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Recuperamos metadatos guardados en checkout/route.ts
        const userId = session.metadata?.userId;
        const shippingRateId = session.metadata?.shippingRateId;
        const addressJson = session.metadata?.address;

        if (!userId || !addressJson) {
            console.error("Faltan metadatos en la sesión de Stripe");
            return NextResponse.json({ status: 400 });
        }

        const addressData = JSON.parse(addressJson);

        try {
            // 3. Obtener los items comprados expandidos (Stripe no los envía completos en el evento principal)
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product'],
            });

            // INICIAMOS TRANSACCIÓN (Todo o nada)
            await prisma.$transaction(async (tx) => {

                // A) Buscar usuario para ver si es PRO
                const user = await tx.user.findUnique({ where: { id: userId } });
                if (!user) throw new Error("Usuario no encontrado");

                // B) Crear Dirección (Billing/Shipping)
                // Nota: Idealmente verificar si ya existe una dirección igual, aquí creamos una nueva por pedido por simplicidad
                const address = await tx.address.create({
                    data: {
                        userId,
                        line1: addressData.address,
                        city: addressData.city,
                        postalCode: addressData.postalCode,
                        country: addressData.country,
                        phone: "000000000", // Stripe no siempre lo pide, poner placeholder o pedirlo en form
                        label: "Envío",
                    }
                });

                // C) Crear la Orden (Cabecera)
                const order = await tx.order.create({
                    data: {
                        userId,
                        addressId: address.id,
                        total: new Decimal(session.amount_total! / 100), // Convertir céntimos a euros
                        subtotal: new Decimal(session.amount_subtotal! / 100),
                        taxTotal: new Decimal(0), // Si Stripe calcula impuestos, sacarlo de total_details
                        shippingCost: new Decimal(session.total_details?.amount_shipping || 0).div(100),
                        status: "PAID",
                        isPaid: true,
                        stripePaymentIntentId: session.payment_intent as string,
                        shippingType: "Stripe Rate", // Podríamos buscar el nombre de la tarifa con shippingRateId
                        shippingRegion: addressData.country === "ES" ? "NATIONAL" : "EUROPE",
                    }
                });

                // D) Procesar Items y Stock
                let proUsageTotal = 0;

                for (const item of lineItems.data) {
                    const productStripe = item.price?.product as Stripe.Product;
                    const variantId = productStripe.metadata.variantId; // ¡Recuperamos el ID que guardamos!
                    const quantity = item.quantity || 1;
                    const unitPrice = item.price!.unit_amount! / 100;

                    if (!variantId) continue;

                    // 1. Crear OrderItem
                    await tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            variantId: variantId,
                            quantity: quantity,
                            pricePaid: new Decimal(unitPrice),
                            wasProPrice: user.isPro, // Asumimos que si es pro pagó precio pro (simplificación segura)
                        }
                    });

                    // 2. RESTAR STOCK (Atómico)
                    const variant = await tx.productVariant.update({
                        where: { id: variantId },
                        data: { stock: { decrement: quantity } }
                    });

                    // 3. CALCULAR CONSUMO SALDO PRO
                    // Si el usuario es PRO, calculamos cuánto "vale" este item en puntos PRO
                    if (user.isPro) {
                        // Usamos el precio pagado como valor a descontar del saldo
                        // OJO: Si tienes lógica donde algunos productos NO gastan saldo, añade un check aquí:
                        if (!variant.proExempt) {
                            proUsageTotal += (unitPrice * quantity);
                        }
                    }
                }

                // E) Crear Envío (Shipment)
                await tx.shipment.create({
                    data: {
                        orderId: order.id,
                        trackingNumber: null,
                    }
                });

                // F) DESCONTAR SALDO PRO
                if (user.isPro && proUsageTotal > 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: {
                            proAllowanceBalance: { decrement: proUsageTotal }
                        }
                    });
                    console.log(`[PRO] Descontados ${proUsageTotal} puntos al usuario ${userId}`);
                }

            }); // Fin Transacción

            console.log(`✅ Orden creada para el usuario ${userId}`);

        } catch (error) {
            console.error("Error creando orden en DB:", error);
            return NextResponse.json({ status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

// Helper para Decimal (Prisma usa Decimal.js)
import { Decimal } from "@prisma/client/runtime/library";