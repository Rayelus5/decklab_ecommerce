import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { Plus, ChevronRight, ImageOff, Archive } from "lucide-react";

export const metadata: Metadata = { title: "Productos — DECKLAB Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; archived?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = parseInt(sp.page ?? "1");
  const showArchived = sp.archived === "1";
  const PAGE_SIZE = 20;

  const where = {
    isArchived: showArchived,
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { slug: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [products, total] = await safeQuery(
    () => Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true, title: true, slug: true, isArchived: true, isFeatured: true,
          isExclusive: true, earlyAccessTierLevel: true,
          category: { select: { name: true } },
          images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
          variants: { select: { stock: true, price: true } },
          createdAt: true,
        },
      }),
      prisma.product.count({ where }),
    ]),
    [[], 0] as const,
    "admin products list"
  );

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-snow">Productos</h1>
          <p className="text-slate-300 text-sm mt-1">{total} producto{total !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-ash-50 hover:bg-white text-graphite-700 text-sm font-semibold rounded-[8px] transition-colors"
        >
          <Plus size={14} />
          Nuevo producto
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <form method="GET" action="/admin/products" className="flex gap-2 flex-1">
          {showArchived && <input type="hidden" name="archived" value="1" />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título o slug..."
            className="flex-1 max-w-sm px-3 py-2 bg-graphite-700/60 border border-white/8 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/20"
          />
        </form>
        <Link
          href={showArchived ? "/admin/products" : "/admin/products?archived=1"}
          className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm transition-colors border ${
            showArchived
              ? "bg-white/8 text-snow border-white/15"
              : "text-slate-300 border-white/8 hover:text-snow"
          }`}
        >
          <Archive size={13} />
          {showArchived ? "Ver activos" : "Ver archivados"}
        </Link>
      </div>

      {/* Products grid */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Stock total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Desde</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Etiquetas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Creado</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-300/60">Sin productos</td></tr>
              )}
              {products.map((product) => {
                const img = product.images[0]?.url;
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
                const minPrice = product.variants.length > 0
                  ? Math.min(...product.variants.map((v) => Number(v.price)))
                  : null;
                return (
                  <tr key={product.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[6px] bg-graphite-600/60 flex items-center justify-center shrink-0 overflow-hidden">
                          {img
                            ? <img src={img} alt={product.title} className="w-full h-full object-cover" />
                            : <ImageOff size={12} className="text-slate-300/40" />
                          }
                        </div>
                        <div>
                          <p className="text-snow font-medium text-xs">{product.title}</p>
                          <p className="text-slate-300/60 text-xs font-mono">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{product.category?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold tabular-nums ${totalStock === 0 ? "text-ember-red" : totalStock <= 5 ? "text-amber-400" : "text-snow"}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs tabular-nums">
                      {minPrice !== null ? `${minPrice.toFixed(2).replace(".", ",")} €` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {product.isFeatured && <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">Dest.</span>}
                        {product.isExclusive && <span className="text-xs text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">Excl.</span>}
                        {product.earlyAccessTierLevel && <span className="text-xs text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded">EA{product.earlyAccessTierLevel}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                      {new Date(product.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${product.id}/edit`} className="cursor-pointer p-1.5 rounded-[6px] text-slate-300 hover:text-snow hover:bg-white/8 transition-colors flex items-center">
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-xs text-slate-300">{total} productos</span>
            <div className="flex items-center gap-2">
              {page > 1 && <Link href={`/admin/products?${q ? `q=${q}&` : ""}${showArchived ? "archived=1&" : ""}page=${page - 1}`} className="cursor-pointer px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px]">Anterior</Link>}
              <span className="text-xs text-slate-300">{page} / {totalPages}</span>
              {page < totalPages && <Link href={`/admin/products?${q ? `q=${q}&` : ""}${showArchived ? "archived=1&" : ""}page=${page + 1}`} className="cursor-pointer px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px]">Siguiente</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
