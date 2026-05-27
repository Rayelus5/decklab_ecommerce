import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { ImageOff } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductCardSkeleton } from "@/components/ui/loader";

export const metadata: Metadata = {
  title: "Tienda — DECKLAB",
  description: "Explora nuestra colección exclusiva de Pokémon TCG personalizado.",
};

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    categoryId?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await auth();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? "1"));
  const limit = 12;
  const skip = (page - 1) * limit;

  const isPro = session?.user?.isPro ?? false;
  const isAdmin = session?.user?.role === "ADMIN";

  // Construir filtros
  const where: Record<string, unknown> = { isArchived: false };

  if (!isAdmin && !isPro) {
    where.earlyAccessTierLevel = null;
  }

  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const [products, total, categories] = await safeQuery(
    () => Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: {
            where: { stock: { gt: 0 } },
            orderBy: { price: "asc" },
            take: 1,
            select: {
              id: true,
              title: true,
              price: true,
              pricePro: true,
              stock: true,
              proExempt: true,
            },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        where: { parentId: null },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    ]),
    [[], 0, []] as const,
    "products.page"
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Cabecera */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-snow">Tienda</h1>
        <p className="text-slate-300 text-sm mt-1">
          {total} producto{total !== 1 ? "s" : ""} disponible{total !== 1 ? "s" : ""}
          {params.q && ` para "${params.q}"`}
        </p>
      </div>

      {/* Filtros */}
      <ProductFilters
        categories={categories}
        currentCategoryId={params.categoryId}
        currentSearch={params.q}
      />

      {/* Grid de productos */}
      <Suspense fallback={
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      }>
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {products.map((product) => {
              const firstVariant = product.variants[0];
              const productImage = product.images[0];

              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  slug={product.slug}
                  title={product.title}
                  imageUrl={productImage?.url}
                  imageAlt={productImage?.alt ?? product.title}
                  variant={firstVariant ? {
                    id: firstVariant.id,
                    title: firstVariant.title ?? undefined,
                    price: Number(firstVariant.price),
                    pricePro: firstVariant.pricePro != null ? Number(firstVariant.pricePro) : null,
                    stock: firstVariant.stock,
                    proExempt: firstVariant.proExempt,
                  } : undefined}
                  isExclusive={product.isExclusive}
                  earlyAccessTierLevel={product.earlyAccessTierLevel}
                  noReturns={product.noReturns}
                  isPro={isPro}
                  hasAccess={
                    isAdmin ||
                    (!product.earlyAccessTierLevel && !product.isExclusive) ||
                    isPro
                  }
                  categoryName={product.category?.name}
                />
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/products?page=${p}${params.categoryId ? `&categoryId=${params.categoryId}` : ""}${params.q ? `&q=${params.q}` : ""}`}
                  className={`w-9 h-9 flex items-center justify-center rounded-[8px] text-sm transition-colors ${
                    p === page
                      ? "bg-ash-50 text-graphite-700 font-semibold"
                      : "text-slate-300 hover:text-snow hover:bg-white/5"
                  }`}
                  aria-label={`Página ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 mb-4 rounded-[14px] bg-graphite-700/60 border border-white/8 flex items-center justify-center" aria-hidden="true">
            <ImageOff size={24} className="text-white/20" />
          </div>
          <h2 className="text-lg font-medium text-snow">
            {params.q ? "Sin resultados" : "No hay productos disponibles"}
          </h2>
          <p className="text-slate-300 text-sm mt-2">
            {params.q
              ? `No encontramos productos para "${params.q}". Prueba con otro término.`
              : "Pronto habrá nuevos productos disponibles. ¡Estate atento!"}
          </p>
          {params.q && (
            <a
              href="/products"
              className="mt-4 text-sm text-ash-50 hover:text-snow underline underline-offset-2 transition-colors"
            >
              Ver todos los productos
            </a>
          )}
        </div>
      )}
      </Suspense>
    </div>
  );
}
