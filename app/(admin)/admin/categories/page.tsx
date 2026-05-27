import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoriesManager } from "./categories-manager";

export const metadata: Metadata = { title: "Categorías — DECKLAB Admin" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      sortOrder: true,
      parentId: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-snow">Categorías</h1>
        <p className="text-slate-300 text-sm mt-1">{categories.length} categoría{categories.length !== 1 ? "s" : ""}</p>
      </div>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
