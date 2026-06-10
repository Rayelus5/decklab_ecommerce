"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  parentId: string | null;
  _count: { products: number };
}

const field = "w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors";

function CategoryForm({
  category,
  categories,
  onSubmit,
  onCancel,
  loading,
}: {
  category?: Category;
  categories: Category[];
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    image: category?.image ?? "",
    sortOrder: category?.sortOrder?.toString() ?? "0",
    parentId: category?.parentId ?? "",
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function handleSubmit() {
    onSubmit({
      name: form.name,
      slug: form.slug || autoSlug(form.name),
      description: form.description || null,
      image: form.image || null,
      sortOrder: parseInt(form.sortOrder),
      parentId: form.parentId || null,
    });
  }

  const parents = categories.filter((c) => c.id !== category?.id && !c.parentId);

  return (
    <div className="bg-graphite-700/40 border border-white/15 rounded-[14px] p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-snow">{category ? "Editar categoría" : "Nueva categoría"}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Nombre</label>
          <input
            className={field}
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!category) set("slug", autoSlug(e.target.value));
            }}
            placeholder="Decks"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Slug</label>
          <input className={`${field} font-mono`} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="decks" />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Orden</label>
          <input className={field} type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1.5">Categoría padre (opcional)</label>
          <select className={field} value={form.parentId} onChange={(e) => set("parentId", e.target.value)}>
            <option value="">Sin padre (raíz)</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">Descripción (opcional)</label>
        <textarea className={`${field} resize-none`} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Descripción de la categoría" />
      </div>
      <div>
        <label className="block text-xs text-slate-300 mb-1.5">URL de imagen (opcional)</label>
        <input className={field} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
      </div>
      <div className="flex gap-3">
        <Button onClick={handleSubmit} loading={loading} className="cursor-pointer"><Check size={14} />{category ? "Guardar" : "Crear"}</Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading} className="cursor-pointer"><X size={14} />Cancelar</Button>
      </div>
    </div>
  );
}

export function CategoriesManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  async function handleCreate(data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Categoría creada");
      setCategories((p) => [...p, { ...json, _count: { products: 0 } }]);
      setShowCreate(false);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleUpdate(id: string, data: Record<string, unknown>) {
    setFormLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error"); return; }
      toast.success("Categoría actualizada");
      setCategories((p) => p.map((c) => c.id === id ? { ...c, ...json } : c));
      setEditingId(null);
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setFormLoading(false); }
  }

  async function handleDelete(id: string, productCount: number) {
    if (productCount > 0) { toast.error("Hay productos en esta categoría"); return; }
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Error al eliminar"); return; }
      toast.success("Categoría eliminada");
      setCategories((p) => p.filter((c) => c.id !== id));
      router.refresh();
    } catch { toast.error("Error de conexión"); }
    finally { setLoadingId(null); }
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat) =>
        editingId === cat.id ? (
          <CategoryForm key={cat.id} category={cat} categories={categories} onSubmit={(d) => handleUpdate(cat.id, d)} onCancel={() => setEditingId(null)} loading={formLoading} />
        ) : (
          <div key={cat.id} className={`bg-graphite-700/40 border border-white/8 rounded-[12px] p-4 flex items-center justify-between gap-4 ${cat.parentId ? "ml-6 border-l-2 border-l-white/15" : ""}`}>
            <div className="flex items-center gap-3">
              <Tag size={14} className="text-slate-300 shrink-0" />
              <div>
                <p className="text-sm font-medium text-snow">{cat.name}</p>
                <p className="text-xs text-slate-300/60 font-mono mt-0.5">/{cat.slug} &middot; {cat._count.products} productos</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditingId(cat.id)} className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-snow hover:bg-white/6 transition-colors"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(cat.id, cat._count.products)} disabled={loadingId === cat.id || cat._count.products > 0} className="p-1.5 rounded-[6px] text-slate-300/60 hover:text-ember-red hover:bg-ember-red/8 transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={cat._count.products > 0 ? "Tiene productos" : "Eliminar"}>
                {loadingId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            </div>
          </div>
        )
      )}
      {showCreate ? (
        <CategoryForm categories={categories} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={formLoading} />
      ) : (
        <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/15 hover:border-white/30 rounded-[12px] text-sm text-slate-300 hover:text-snow transition-all">
          <Plus size={14} />
          Nueva categoría
        </button>
      )}
    </div>
  );
}
