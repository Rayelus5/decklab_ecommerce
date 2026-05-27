import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProTiersManager } from "./pro-tiers-manager";

export const metadata: Metadata = { title: "PRO Tiers — DECKLAB Admin" };

export default async function AdminProTiersPage() {
  const tiers = await prisma.proTier.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      priceMonthly: true,
      monthlyAllowance: true,
      stripePriceId: true,
      benefits: true,
      isActive: true,
      sortOrder: true,
      _count: { select: { users: true } },
    },
  });

  const serialized = tiers.map((t) => ({
    ...t,
    priceMonthly: Number(t.priceMonthly),
    monthlyAllowance: Number(t.monthlyAllowance),
  }));

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-snow">PRO Tiers</h1>
        <p className="text-slate-300 text-sm mt-1">
          Gestiona los planes de suscripción. Los cambios se reflejan en el stripe y en la página de precios.
        </p>
      </div>
      <ProTiersManager initialTiers={serialized} />
    </div>
  );
}
