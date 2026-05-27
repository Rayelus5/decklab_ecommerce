import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const metadata: Metadata = {
  title: "Checkout — DECKLAB",
};

export default async function CheckoutPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  // Cargar datos necesarios para el checkout
  const [addresses, shippingRates, proTier] = await Promise.all([
    prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.shippingRate.findMany({
      where: { active: true },
      orderBy: [{ region: "asc" }, { type: "asc" }, { minWeight: "asc" }],
    }),
    session.user.isPro && session.user.proTierId
      ? prisma.proTier.findUnique({
          where: { id: session.user.proTierId },
          select: {
            id: true,
            name: true,
            benefits: true,
          },
        })
      : null,
  ]);

  const userBalance = session.user.isPro
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { proAllowanceBalance: true },
      })
    : null;

  const benefits = proTier?.benefits as Record<string, unknown> | null;

  return (
    <CheckoutClient
      userId={session.user.id}
      isPro={session.user.isPro}
      proAllowanceBalance={userBalance?.proAllowanceBalance ? Number(userBalance.proAllowanceBalance) : 0}
      hasFreeShipping={benefits?.freeShipping === true}
      addresses={addresses.map((a) => ({
        id: a.id,
        label: a.label ?? undefined,
        line1: a.line1,
        line2: a.line2 ?? undefined,
        city: a.city,
        postalCode: a.postalCode,
        province: a.province ?? undefined,
        country: a.country,
        phone: a.phone,
        isDefault: a.isDefault,
      }))}
      shippingRates={shippingRates.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        region: r.region,
        minWeight: r.minWeight,
        maxWeight: r.maxWeight,
        price: Number(r.price),
      }))}
    />
  );
}
