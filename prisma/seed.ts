import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando Seed Completo...');

    // --- 1. NIVELES PRO (Mantenemos lo anterior) ---
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
            update: { priceMonthly: tier.price, monthlyAllowance: tier.allowance },
            create: {
                name: tier.name,
                priceMonthly: tier.price,
                monthlyAllowance: tier.allowance,
                stripePriceId: tier.stripeId,
                description: `Acceso a precios PRO y cupo de ${tier.allowance}€`,
            },
        });
    }

    // --- 2. TARIFAS ENVÍO (Mantenemos lo anterior) ---
    const shippingRates = [
        { name: 'Ordinario Nacional (<500g)', type: 'ORDINARIO', region: 'NATIONAL', minWeight: 0, maxWeight: 500, price: 3.00 },
        { name: 'Certificado Nacional (<500g)', type: 'CERTIFICADO', region: 'NATIONAL', minWeight: 0, maxWeight: 500, price: 6.00 },
        { name: 'Ordinario Europa (<500g)', type: 'ORDINARIO', region: 'EUROPE', minWeight: 0, maxWeight: 500, price: 7.00 },
    ];

    for (const rate of shippingRates) {
        const existing = await prisma.shippingRate.findFirst({ where: { name: rate.name } });
        if (!existing) {
            await prisma.shippingRate.create({ data: rate as any });
        }
    }

    // --- 3. CATEGORÍAS ---
    console.log('📦 Creando Categorías...');
    const catDecks = await prisma.category.upsert({
        where: { slug: 'barajas' },
        update: {},
        create: { name: 'Barajas', slug: 'barajas', description: 'Naipes de alta calidad para cardistry y magia.' }
    });

    const catMagic = await prisma.category.upsert({
        where: { slug: 'trucos-magia' },
        update: {},
        create: { name: 'Trucos de Magia', slug: 'trucos-magia', description: 'Gimmicks y efectos visuales.' }
    });

    // --- 4. PRODUCTOS ---
    console.log('🃏 Creando Productos...');

    // Producto A: Baraja Premium (Con precio PRO)
    const productA = await prisma.product.upsert({
        where: { slug: 'baraja-virtuoso' },
        update: {},
        create: {
            title: 'Baraja Virtuoso FW17',
            slug: 'baraja-virtuoso',
            description: 'La primera baraja diseñada específicamente para Cardistry. Geometría adaptativa.',
            categoryId: catDecks.id,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1620407637829-17d122247f12?auto=format&fit=crop&q=80&w=800', alt: 'Virtuoso Deck Main' }
                ]
            },
            variants: {
                create: [
                    {
                        sku: 'VIRT-FW17',
                        price: 25.00,
                        pricePro: 15.00, // Gran descuento PRO
                        stock: 50,
                        weight: 100,
                        attributes: { color: 'Green/Black' }
                    }
                ]
            }
        }
    });

    // Producto B: Truco de Magia (Sin precio PRO)
    const productB = await prisma.product.upsert({
        where: { slug: 'invisible-deck' },
        update: {},
        create: {
            title: 'Baraja Invisible',
            slug: 'invisible-deck',
            description: 'El clásico de la cartomagia. Una carta pensada aparece dada la vuelta.',
            categoryId: catMagic.id,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1595256976993-f089602e1c31?auto=format&fit=crop&q=80&w=800', alt: 'Invisible Deck' }
                ]
            },
            variants: {
                create: [
                    {
                        sku: 'INV-BICYCLE-RED',
                        price: 12.00,
                        pricePro: null, // NO TIENE PRECIO PRO (Producto normal)
                        stock: 20,
                        weight: 100,
                        attributes: { back: 'Red' }
                    },
                    {
                        sku: 'INV-BICYCLE-BLUE',
                        price: 12.00,
                        pricePro: null,
                        stock: 20,
                        weight: 100,
                        attributes: { back: 'Blue' }
                    }
                ]
            }
        }
    });

    // Producto C: Baraja Lujo (Alto precio, consume mucho saldo PRO)
    const productC = await prisma.product.upsert({
        where: { slug: 'gold-artisan' },
        update: {},
        create: {
            title: 'Gold Artisan Edition',
            slug: 'gold-artisan',
            description: 'Lujo puro. Pan de oro real en el estuche. Edición limitada.',
            categoryId: catDecks.id,
            isFeatured: true,
            images: {
                create: [
                    { url: 'https://images.unsplash.com/photo-1517260739337-6799d2df3087?auto=format&fit=crop&q=80&w=800', alt: 'Gold Artisan' }
                ]
            },
            variants: {
                create: [
                    {
                        sku: 'ARTISAN-GOLD',
                        price: 40.00,
                        pricePro: 25.00,
                        stock: 5,
                        weight: 120
                    }
                ]
            }
        }
    });

    console.log('✅ Seed completado con productos de ejemplo.');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });