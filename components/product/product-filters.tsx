"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, X } from "lucide-react";
import { clsx } from "clsx";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  currentCategoryId?: string;
  currentSearch?: string;
}

export function ProductFilters({
  categories,
  currentCategoryId,
  currentSearch,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset page when filtering
      params.delete("page");

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      return params.toString();
    },
    [searchParams]
  );

  function handleCategoryChange(categoryId: string | null) {
    startTransition(() => {
      const qs = createQueryString({ categoryId });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    startTransition(() => {
      const qs = createQueryString({ q: q.trim() });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }

  function clearSearch() {
    startTransition(() => {
      const qs = createQueryString({ q: null });
      router.push(`${pathname}?${qs}`, { scroll: false });
    });
  }

  return (
    <div className={clsx("flex flex-col gap-4", isPending && "opacity-70 pointer-events-none")}>
      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
            aria-hidden="true"
          />
          <input
            name="q"
            type="search"
            defaultValue={currentSearch}
            placeholder="Buscar productos..."
            className="w-full bg-white/5 border border-white/8 rounded-[8px] pl-9 pr-9 py-2 text-sm text-snow placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-ash-50/30 focus:border-ash-50/30 transition-colors"
            aria-label="Buscar productos"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-snow transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-ash-50 text-graphite-700 text-sm font-medium rounded-[8px] hover:bg-white transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Filtros de categoría */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <button
            onClick={() => handleCategoryChange(null)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
              !currentCategoryId
                ? "bg-ash-50 text-graphite-700 border-transparent"
                : "bg-transparent text-slate-300 border-white/12 hover:text-snow hover:border-white/20"
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                currentCategoryId === cat.id
                  ? "bg-ash-50 text-graphite-700 border-transparent"
                  : "bg-transparent text-slate-300 border-white/12 hover:text-snow hover:border-white/20"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
