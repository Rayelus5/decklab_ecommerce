import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, ShieldAlert, ImageOff, Crown, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProbabilityTable } from "@/components/product/probability-table";
import { ProductActions } from "@/components/product/product-actions";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, description: true },
  });

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

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      variants: {
        orderBy: { price: "asc" },
        select: {
          id: true,
          sku: true,
          title: true,
          price: true,
          pricePro: true,
          proExempt: true,
          stock: true,
          weight: true,
          attributes: true,
        },
      },
    },
  });

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
        // Verificar nivel suficiente
        const userTier = await prisma.proTier.findUnique({
          where: { id: session?.user?.proTierId ?? "" },
          select: { sortOrder: true },
        });
        if (!userTier || userTier.sortOrder < product.earlyAccessTierLevel) {
          accessDenied = true;
          accessMessage = `Este producto requiere Nivel ${product.earlyAccessTierLevel} o superior`;
        }
      }
    }

    if (!accessDenied && product.isExclusive && isPro) {
      const userTier = await prisma.proTier.findUnique({
        where: { id: session?.user?.proTierId ?? "" },
        select: { benefits: true },
      });
      const benefits = userTier?.benefits as Record<string, unknown> | null;
      if (!benefits?.exclusiveProducts) {
        accessDenied = true;
        accessMessage = "Este producto es exclusivo para tiers PRO con acceso exclusivo";
      }
    }
  }

  const mainImage = product.images[0];
  const availableVariants = product.variants.filter((v) => v.stock > 0);

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
        <div className="flex flex-col gap-3">
          {/* Imagen principal */}
          <div className="relative aspect-square bg-graphite-700/40 border border-white/8 rounded-[16px] overflow-hidden">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={mainImage.alt ?? product.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <ImageOff size={40} className="text-white/10" />
              </div>
            )}
          </div>

          {/* Miniaturas */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square bg-graphite-700/40 border border-white/8 rounded-[8px] overflow-hidden cursor-pointer hover:border-white/20 transition-colors"
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? product.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

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
                stock: v.stock,
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
