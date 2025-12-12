import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Seed de datos maestros...');

    // 1. Crear Niveles PRO (Upsert para no duplicar si ejecutas de nuevo)
    const tiers = [
        { name: 'Nivel 1', price: 4.99, allowance: 50, stripeId: 'price_tier1_dummy' },
        { name: 'Nivel 2', price: 8.99, allowance: 100, stripeId: 'price_tier2_dummy' },
        { name: 'Nivel 3', price: 18.99, allowance: 200, stripeId: 'price_tier3_dummy' },
        { name: 'Nivel 4', price: 25.99, allowance: 250, stripeId: 'price_tier4_dummy' },
        { name: 'Nivel 5', price: 39.99, allowance: 400, stripeId: 'price_tier5_dummy' },
    ];

    for (const tier of tiers) {
        await prisma.proTier.upsert({
            where: { name: tier.name },
            update: {
                priceMonthly: tier.price,
                monthlyAllowance: tier.allowance,
            },
            create: {
                name: tier.name,
                priceMonthly: tier.price,
                monthlyAllowance: tier.allowance,
                stripePriceId: tier.stripeId,
                description: `Acceso a precios PRO y cupo de ${tier.allowance}€`,
            },
        });
    }
    console.log('✅ Niveles PRO creados.');

    // 2. Crear Tarifas de Envío (Ejemplos base)
    const shippingRates = [
        // ORDINARIO NACIONAL
        { name: 'Ordinario Nacional (<500g)', type: 'ORDINARIO', region: 'NATIONAL', min: 0, max: 500, price: 3.00 },
        { name: 'Ordinario Nacional (500g-1kg)', type: 'ORDINARIO', region: 'NATIONAL', min: 501, max: 1000, price: 5.00 },

        // ORDINARIO EUROPA
        { name: 'Ordinario Europa (<500g)', type: 'ORDINARIO', region: 'EUROPE', min: 0, max: 500, price: 7.00 },

        // CERTIFICADO NACIONAL
        { name: 'Certificado Nacional (<500g)', type: 'CERTIFICADO', region: 'NATIONAL', min: 0, max: 500, price: 6.00 },
    ];

    for (const rate of shippingRates) {
        // Usamos el nombre como clave única para el upsert en este seed básico
        // En prod idealmente usaríamos un ID fijo o búsqueda compuesta
        const existing = await prisma.shippingRate.findFirst({ where: { name: rate.name } });

        if (!existing) {
            await prisma.shippingRate.create({
                data: {
                    name: rate.name,
                    type: rate.type,
                    region: rate.region as any,
                    minWeight: rate.min,
                    maxWeight: rate.max,
                    price: rate.price,
                }
            });
        }
    }
    console.log('✅ Tarifas de envío creadas.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });