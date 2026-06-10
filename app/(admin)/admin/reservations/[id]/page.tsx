import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { ReservationForm } from "../reservation-form";

export const metadata: Metadata = { title: "Editar reserva — Admin DECKLAB" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditReservationPage({ params }: PageProps) {
  const { id } = await params;

  const [reservation, coupons, products] = await safeQuery(
    () => Promise.all([
      prisma.reservationPeriod.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          opensAt: true,
          closesAt: true,
          deliveryDate: true,
          couponId: true,
          productIds: true,
          badgeText: true,
          popupEnabled: true,
          maxUnits: true,
          isActive: true,
        },
      }),
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
    [null, [], []] as const,
    "reservation.edit fetch"
  );

  if (!reservation) notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link
        href="/admin/reservations"
        className="cursor-pointer inline-flex items-center gap-2 text-sm text-slate-300 hover:text-snow transition-colors mb-8"
      >
        <ArrowLeft size={15} />
        Volver a reservas
      </Link>

      <h1 className="text-xl font-semibold text-snow mb-6">
        Editar: <span className="text-slate-300 font-normal">{reservation.name}</span>
      </h1>

      <ReservationForm
        coupons={coupons.map((c) => ({ ...c, value: Number(c.value) }))}
        products={products}
        initial={{
          ...reservation,
          description: reservation.description ?? null,
          opensAt: reservation.opensAt.toISOString(),
          closesAt: reservation.closesAt.toISOString(),
          deliveryDate: reservation.deliveryDate?.toISOString() ?? null,
          couponId: reservation.couponId ?? null,
        }}
      />
    </div>
  );
}
