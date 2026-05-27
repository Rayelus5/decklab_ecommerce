import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "Nuevo producto — DECKLAB Admin" };

export default async function AdminNewProductPage() {
  const categories = await safeQuery(
    () => prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    [],
    "categories.findMany"
  );

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-snow mb-6">Nuevo producto</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
