import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { ReservationForm } from "../reservation-form";

export const metadata: Metadata = { title: "Nueva reserva — Admin DECKLAB" };

export default async function NewReservationPage() {
  const [coupons, products] = await safeQuery(
    () => Promise.all([
      prisma.coupon.findMany({
        where: { isActive: true },
        select: { id: true, code: true, type: true, value: true, maxUses: true },
        orderBy: { code: "asc" },
      }),
      prisma.product.findMany({
        where: { isArchived: false },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
      }),
    ]),
    [[], []] as const,
    "reservations.new fetch"
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link
        href="/admin/reservations"
        className="cursor-pointer inline-flex items-center gap-2 text-sm text-slate-300 hover:text-snow transition-colors mb-8"
      >
        <ArrowLeft size={15} />
        Volver a reservas
      </Link>

      <h1 className="text-xl font-semibold text-snow mb-6">Nueva reserva anticipada</h1>

      <ReservationForm
        coupons={coupons.map((c) => ({ ...c, value: Number(c.value) }))}
        products={products}
      />
    </div>
  );
}
