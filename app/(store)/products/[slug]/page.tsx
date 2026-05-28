export const revalidate = 3600;

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package, ShieldAlert, Crown, Zap, Clock, Copy, Check, Calendar, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { ProbabilityTable } from "@/components/product/probability-table";
import { ProductActions } from "@/components/product/product-actions";
import { ProductGallery } from "@/components/product/product-gallery";
import { CountdownTimer } from "@/components/reservations/countdown-timer";
import { ReservationCopyButton } from "@/components/reservations/reservation-copy-button";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await safeQuery(
    () => prisma.product.findUnique({ where: { slug }, select: { title: true, description: true } }),
    null,
    "generateMetadata product"
  );
  if (!product) return {};
  return {
    title: `${product.title} — DECKLAB`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const session = await auth();
  const isPro = session?.user?.isPro ?? false;
  const isAdmin = session?.user?.role === "ADMIN";

  const product = await safeQuery(
    () => prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: "asc" } },
        variants: {
          orderBy: { price: "asc" },
          select: { id: true, sku: true, title: true, price: true, pricePro: true, proExempt: true, stock: true, reservedStock: true, weight: true, attributes: true },
        },
      },
    }),
    null,
    "product.findUnique"
  );

  if (!product || (product.isArchived && !isAdmin)) {
    notFound();
  }

  // Verificar acceso
  let accessDenied = false;
  let accessMessage = "";

  if (!isAdmin) {
    if (product.earlyAccessTierLevel !== null) {
      if (!isPro) {
        accessDenied = true;
        accessMessage = "Este producto requiere suscripción PRO";
      } else {
        const userTier = await safeQuery(
          () => prisma.proTier.findUnique({ where: { id: session?.user?.proTierId ?? "" }, select: { sortOrder: true } }),
          null,
          "proTier.findUnique (earlyAccess)"
        );
        if (!userTier || userTier.sortOrder < product.earlyAccessTierLevel) {
          accessDenied = true;
          accessMessage = `Este producto requiere Nivel ${product.earlyAccessTierLevel} o superior`;
        }
      }
    }

    if (!accessDenied && product.isExclusive && isPro) {
      const userTier = await safeQuery(
        () => prisma.proTier.findUnique({ where: { id: session?.user?.proTierId ?? "" }, select: { benefits: true } }),
        null,
        "proTier.findUnique (exclusive)"
      );
      const benefits = userTier?.benefits as Record<string, unknown> | null;
      if (!benefits?.exclusiveProducts) {
        accessDenied = true;
        accessMessage = "Este producto es exclusivo para tiers PRO con acceso exclusivo";
      }
    }
  }

  const mainImage = product.images[0];

  // Reserva activa que incluye este producto
  const now = new Date();
  const activeReservation = await safeQuery(
    () => prisma.reservationPeriod.findFirst({
      where: {
        isActive: true,
        opensAt: { lte: now },
        closesAt: { gt: now },
        productIds: { has: product.id },
      },
      select: {
        id: true,
        name: true,
        closesAt: true,
        deliveryDate: true,
        maxUnits: true,
        badgeText: true,
        coupon: {
          select: { code: true, usesCount: true, type: true, value: true },
        },
      },
    }),
    null,
    "reservationPeriod.findFirst (slug)"
  );

  const spotsRemaining =
    activeReservation?.maxUnits != null && activeReservation.coupon
      ? Math.max(0, activeReservation.maxUnits - activeReservation.coupon.usesCount)
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-snow transition-colors mb-8"
      >
        <ArrowLeft size={15} />
        Volver a la tienda
      </Link>

      {/* Banner de reserva anticipada */}
      {activeReservation && (
        <div className="mb-8 bg-amber-950/40 border border-amber-500/25 rounded-[14px] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icono + nombre */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Clock size={16} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-400 font-medium uppercase tracking-wider">Reserva anticipada</p>
              <p className="text-snow font-semibold text-sm truncate">{activeReservation.name}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 sm:ml-auto items-center">
            {/* Countdown */}
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Cierra en</p>
              <CountdownTimer closesAt={activeReservation.closesAt.toISOString()} className="text-sm" />
            </div>

            {/* Código cupón */}
            {activeReservation.coupon && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Descuento{" "}
                  {activeReservation.coupon.type === "PERCENT"
                    ? `${Number(activeReservation.coupon.value).toFixed(0)}%`
                    : `${Number(activeReservation.coupon.value).toFixed(2)} €`}
                </p>
                <ReservationCopyButton code={activeReservation.coupon.code} />
              </div>
            )}

            {/* Fecha de entrega */}
            {activeReservation.deliveryDate && (
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Calendar size={12} className="text-slate-400 shrink-0" />
                <span>
                  Entrega est.{" "}
                  <span className="text-snow font-medium">
                    {new Date(activeReservation.deliveryDate).toLocaleDateString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>
            )}

            {/* Plazas restantes */}
            {spotsRemaining != null && (
              <div className="flex items-center gap-1.5 text-xs">
                <Users
                  size={12}
                  className={
                    spotsRemaining > activeReservation.maxUnits! * 0.5
                      ? "text-emerald-400"
                      : spotsRemaining > activeReservation.maxUnits! * 0.2
                      ? "text-amber-400"
                      : "text-red-400"
                  }
                />
                <span
                  className={
                    spotsRemaining > activeReservation.maxUnits! * 0.5
                      ? "text-emerald-400 font-semibold"
                      : spotsRemaining > activeReservation.maxUnits! * 0.2
                      ? "text-amber-400 font-semibold"
                      : "text-red-400 font-semibold"
                  }
                >
                  {spotsRemaining} plazas restantes
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Access denied */}
      {accessDenied && (
        <div className="mb-8 bg-ember-red/10 border border-ember-red/20 rounded-[11px] px-4 py-4 flex items-start gap-3">
          <ShieldAlert size={20} className="text-ember-red shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-snow">{accessMessage}</p>
            <Link
              href="/pricing"
              className="text-xs text-ember-red hover:text-ember-red/80 underline underline-offset-2 mt-1 inline-block"
            >
              Ver planes PRO →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Galería */}
        <ProductGallery
          images={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt ?? null,
          }))}
          productTitle={product.title}
        />

        {/* Info del producto */}
        <div className="flex flex-col gap-6">
          {/* Cabecera */}
          <div>
            {product.category && (
              <Link
                href={`/products?categoryId=${product.category.id}`}
                className="text-xs text-slate-300 uppercase tracking-widest hover:text-snow transition-colors"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl font-semibold text-snow mt-1 leading-snug">
              {product.title}
            </h1>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.isExclusive && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-full flex items-center gap-1.5">
                <Crown size={11} />
                EXCLUSIVO PRO
              </span>
            )}
            {product.earlyAccessTierLevel && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-sky-500/15 border border-sky-500/25 text-sky-400 rounded-full flex items-center gap-1.5">
                <Zap size={11} />
                EARLY ACCESS — Nivel {product.earlyAccessTierLevel}+
              </span>
            )}
            {product.noReturns && (
              <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-full flex items-center gap-1">
                <ShieldAlert size={11} />
                Sin devoluciones
              </span>
            )}
          </div>

          {/* Descripción */}
          {product.description && (
            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Acciones de compra (client component) */}
          <ProductActions
            product={{
              id: product.id,
              title: product.title,
              slug: product.slug,
              imageUrl: mainImage?.url,
              variants: product.variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                title: v.title,
                price: Number(v.price),
                pricePro: v.pricePro != null ? Number(v.pricePro) : null,
                proExempt: v.proExempt,
                stock: Math.max(0, v.stock - v.reservedStock), // Stock disponible real
                weight: v.weight,
                attributes: v.attributes,
              })),
            }}
            isPro={isPro}
            accessDenied={accessDenied}
          />

          {/* Envío */}
          <div className="flex items-start gap-3 bg-graphite-700/30 border border-white/8 rounded-[11px] px-4 py-3">
            <Package size={16} className="text-slate-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-snow">Envío disponible</p>
              <p className="text-xs text-slate-300 mt-0.5">
                Nacional e internacional. Ordinario y certificado. Se calcula en el checkout.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de probabilidades */}
      {product.probabilityData && (
        <div className="mt-10">
          <ProbabilityTable
            data={product.probabilityData as Record<string, string>}
            title="Tabla de probabilidades"
          />
        </div>
      )}
    </div>
  );
}
