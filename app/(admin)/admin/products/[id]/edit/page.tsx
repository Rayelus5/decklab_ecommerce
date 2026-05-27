import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Editar producto — DECKLAB Admin" };

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, variants, productImages, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.productVariant.findMany({
      where: { productId: id },
      select: {
        id: true,
        sku: true,
        title: true,
        price: true,
        pricePro: true,
        proExempt: true,
        stock: true,
        weight: true,
      },
    }),
    prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { position: "asc" },
      select: { id: true, url: true, alt: true, position: true },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  const serializedProduct = {
    ...product,
    variants: variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      title: v.title ?? "",
      price: Number(v.price).toFixed(2),
      pricePro: v.pricePro ? Number(v.pricePro).toFixed(2) : "",
      proExempt: v.proExempt,
      stock: v.stock.toString(),
      weight: v.weight.toString(),
    })),
    images: productImages.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? "",
      position: img.position,
    })),
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-snow mb-6">Editar: {product.title}</h1>
      <ProductForm categories={categories} product={serializedProduct} />
    </div>
  );
}
