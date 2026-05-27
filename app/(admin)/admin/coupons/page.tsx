import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CouponsManager } from "./coupons-manager";

export const metadata: Metadata = { title: "Cupones — DECKLAB Admin" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minOrderAmount: true,
      maxUses: true,
      usesCount: true,
      maxUsesPerUser: true,
      expiresAt: true,
      isActive: true,
      productIds: true,
      categoryIds: true,
      createdAt: true,
    },
  });

  const serialized = coupons.map((c) => ({
    ...c,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
  }));

  return (
    <div className="p-6 flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-snow">Cupones</h1>
        <p className="text-slate-300 text-sm mt-1">{coupons.length} cupón{coupons.length !== 1 ? "es" : ""} creado{coupons.length !== 1 ? "s" : ""}</p>
      </div>
      <CouponsManager initialCoupons={serialized} />
    </div>
  );
}
