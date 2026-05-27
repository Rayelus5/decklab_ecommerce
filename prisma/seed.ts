import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de DECKLAB SHOP...\n");

  // =============================================================
  // 1. ADMIN USER
  // =============================================================
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@decklab.shop";
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? "DeckLab2024!",
    12
  );

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "DECKLAB Admin",
      password: adminPassword,
      role: "ADMIN",
      isPro: false,
      isTelegramMember: true,
    },
  });
  console.log(`✅ Admin creado: ${admin.email}`);

  // =============================================================
  // 2. PRO TIERS (5 niveles, configurables desde el admin)
  //    Los stripePriceId se actualizan desde el panel de admin
  //    una vez se creen los productos en Stripe Dashboard
  // =============================================================
  const proTiers = [
    {
      name: "Nivel 1",
      priceMonthly: 4.99,
      monthlyAllowance: 50.0,
      stripePriceId: "price_PLACEHOLDER_NIVEL_1",
      description:
        "Ideal para empezar. Accede a precios PRO con 50€ de capacidad mensual.",
      benefits: {
        earlyAccessHours: 0,
        freeShipping: false,
        exclusiveProducts: false,
        bonusAllowancePercent: 0,
      },
      sortOrder: 1,
    },
    {
      name: "Nivel 2",
      priceMonthly: 9.99,
      monthlyAllowance: 100.0,
      stripePriceId: "price_PLACEHOLDER_NIVEL_2",
      description:
        "100€ de capacidad mensual para disfrutar de precios PRO en más productos.",
      benefits: {
        earlyAccessHours: 12,
        freeShipping: false,
        exclusiveProducts: false,
        bonusAllowancePercent: 0,
      },
      sortOrder: 2,
    },
    {
      name: "Nivel 3",
      priceMonthly: 19.99,
      monthlyAllowance: 200.0,
      stripePriceId: "price_PLACEHOLDER_NIVEL_3",
      description:
        "200€ de capacidad + acceso anticipado 24h a nuevos productos.",
      benefits: {
        earlyAccessHours: 24,
        freeShipping: false,
        exclusiveProducts: false,
        bonusAllowancePercent: 5,
      },
      sortOrder: 3,
    },
    {
      name: "Nivel 4",
      priceMonthly: 29.99,
      monthlyAllowance: 300.0,
      stripePriceId: "price_PLACEHOLDER_NIVEL_4",
      description:
        "300€ de capacidad + acceso anticipado 48h + envío gratis + 10% bonus de allowance.",
      benefits: {
        earlyAccessHours: 48,
        freeShipping: true,
        exclusiveProducts: false,
        bonusAllowancePercent: 10,
      },
      sortOrder: 4,
    },
    {
      name: "Nivel 5",
      priceMonthly: 39.99,
      monthlyAllowance: 400.0,
      stripePriceId: "price_PLACEHOLDER_NIVEL_5",
      description:
        "El nivel más alto. 400€ + acceso exclusivo + 48h anticipado + envío gratis + 15% bonus.",
      benefits: {
        earlyAccessHours: 48,
        freeShipping: true,
        exclusiveProducts: true,
        bonusAllowancePercent: 15,
      },
      sortOrder: 5,
    },
  ];

  for (const tier of proTiers) {
    await prisma.proTier.upsert({
      where: { name: tier.name },
      update: {
        priceMonthly: tier.priceMonthly,
        monthlyAllowance: tier.monthlyAllowance,
        description: tier.description,
        benefits: tier.benefits,
        sortOrder: tier.sortOrder,
      },
      create: tier,
    });
  }
  console.log(`✅ ${proTiers.length} ProTiers creados`);

  // =============================================================
  // 3. SHIPPING RATES
  //    Correos España — Ordinario y Certificado
  //    Nacional (ES) y Europa (EU)
  // =============================================================
  const shippingRates = [
    // --- NACIONAL ORDINARIO ---
    {
      name: "Ordinario Nacional ≤ 500g",
      type: "ORDINARIO",
      region: "NATIONAL" as const,
      minWeight: 0,
      maxWeight: 500,
      price: 2.9,
    },
    {
      name: "Ordinario Nacional 501g - 1kg",
      type: "ORDINARIO",
      region: "NATIONAL" as const,
      minWeight: 501,
      maxWeight: 1000,
      price: 3.9,
    },
    {
      name: "Ordinario Nacional 1kg - 2kg",
      type: "ORDINARIO",
      region: "NATIONAL" as const,
      minWeight: 1001,
      maxWeight: 2000,
      price: 5.5,
    },
    {
      name: "Ordinario Nacional +2kg",
      type: "ORDINARIO",
      region: "NATIONAL" as const,
      minWeight: 2001,
      maxWeight: -1,
      price: 7.5,
    },
    // --- NACIONAL CERTIFICADO ---
    {
      name: "Certificado Nacional ≤ 500g",
      type: "CERTIFICADO",
      region: "NATIONAL" as const,
      minWeight: 0,
      maxWeight: 500,
      price: 4.5,
    },
    {
      name: "Certificado Nacional 501g - 1kg",
      type: "CERTIFICADO",
      region: "NATIONAL" as const,
      minWeight: 501,
      maxWeight: 1000,
      price: 5.5,
    },
    {
      name: "Certificado Nacional 1kg - 2kg",
      type: "CERTIFICADO",
      region: "NATIONAL" as const,
      minWeight: 1001,
      maxWeight: 2000,
      price: 7.5,
    },
    {
      name: "Certificado Nacional +2kg",
      type: "CERTIFICADO",
      region: "NATIONAL" as const,
      minWeight: 2001,
      maxWeight: -1,
      price: 10.5,
    },
    // --- EUROPA ORDINARIO ---
    {
      name: "Ordinario Europa ≤ 500g",
      type: "ORDINARIO",
      region: "EUROPE" as const,
      minWeight: 0,
      maxWeight: 500,
      price: 5.5,
    },
    {
      name: "Ordinario Europa 501g - 1kg",
      type: "ORDINARIO",
      region: "EUROPE" as const,
      minWeight: 501,
      maxWeight: 1000,
      price: 8.0,
    },
    {
      name: "Ordinario Europa +1kg",
      type: "ORDINARIO",
      region: "EUROPE" as const,
      minWeight: 1001,
      maxWeight: -1,
      price: 12.0,
    },
    // --- EUROPA CERTIFICADO ---
    {
      name: "Certificado Europa ≤ 500g",
      type: "CERTIFICADO",
      region: "EUROPE" as const,
      minWeight: 0,
      maxWeight: 500,
      price: 8.5,
    },
    {
      name: "Certificado Europa 501g - 1kg",
      type: "CERTIFICADO",
      region: "EUROPE" as const,
      minWeight: 501,
      maxWeight: 1000,
      price: 12.0,
    },
    {
      name: "Certificado Europa +1kg",
      type: "CERTIFICADO",
      region: "EUROPE" as const,
      minWeight: 1001,
      maxWeight: -1,
      price: 18.0,
    },
  ];

  for (const rate of shippingRates) {
    await prisma.shippingRate.upsert({
      where: { id: `seed_${rate.type}_${rate.region}_${rate.minWeight}` },
      update: rate,
      create: { id: `seed_${rate.type}_${rate.region}_${rate.minWeight}`, ...rate },
    });
  }
  console.log(`✅ ${shippingRates.length} ShippingRates creadas`);

  // =============================================================
  // 4. CATEGORÍAS BASE
  // =============================================================
  const categories = [
    { name: "Sobres", slug: "sobres", description: "Sobres de Pokémon TCG personalizados", sortOrder: 1 },
    { name: "Decks", slug: "decks", description: "Mazos completos y estructurados", sortOrder: 2 },
    { name: "Colecciones", slug: "colecciones", description: "Sets de colección especiales", sortOrder: 3 },
    { name: "Sets Completos", slug: "sets-completos", description: "Sets de expansión completos", sortOrder: 4 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} Categorías creadas`);

  // =============================================================
  // 5. PRODUCTO DE EJEMPLO (solo para desarrollo)
  // =============================================================
  if (process.env.NODE_ENV === "development") {
    const sobresCategory = await prisma.category.findUnique({
      where: { slug: "sobres" },
    });

    await prisma.product.upsert({
      where: { slug: "sobre-ejemplo-scarlet-violet" },
      update: {},
      create: {
        title: "Sobre Custom — Scarlet & Violet",
        slug: "sobre-ejemplo-scarlet-violet",
        description:
          "Un sobre personalizado con 10 cartas del set Scarlet & Violet en inglés. Contiene cartas seleccionadas aleatoriamente con las probabilidades publicadas. Sin devoluciones.",
        categoryId: sobresCategory?.id,
        isFeatured: true,
        probabilityData: {
          "Common (C)": "50%",
          "Uncommon (U)": "30%",
          "Rare (R)": "15%",
          "Double Rare (RR)": "4%",
          "Ultra Rare (SAR)": "1%",
        },
        noReturns: true,
        variants: {
          create: [
            {
              sku: "SV-CUSTOM-EN-STD",
              title: "Estándar (10 cartas EN)",
              price: 12.99,
              pricePro: 7.99,
              stock: 50,
              weight: 80, // 80 gramos
            },
            {
              sku: "SV-CUSTOM-EN-PRE",
              title: "Premium (15 cartas EN + 1 garantizada Rare+)",
              price: 19.99,
              pricePro: 12.99,
              stock: 25,
              weight: 120, // 120 gramos
            },
          ],
        },
        images: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600",
              alt: "Sobre Pokémon TCG Scarlet & Violet",
              position: 0,
            },
          ],
        },
      },
    });
    console.log("✅ Producto de ejemplo creado (solo desarrollo)");
  }

  console.log("\n🚀 Seed completado correctamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
