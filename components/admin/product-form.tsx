"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Trash2, Save, ArrowLeft, ImageOff, Archive, ArchiveRestore,
  GripVertical, Image as ImageIcon, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Variant {
  id?: string;
  sku: string;
  title: string;
  price: string;
  pricePro: string;
  proExempt: boolean;
  stock: string;
  weight: string;
}

interface ProductImage {
  id?: string;
  url: string;
  alt: string;
  position: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    categoryId: string | null;
    isArchived: boolean;
    isFeatured: boolean;
    isExclusive: boolean;
    earlyAccessTierLevel: number | null;
    noReturns: boolean;
    probabilityData: unknown;
    variants: Variant[];
    images: ProductImage[];
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const field =
  "w-full px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/25 transition-colors";

function emptyVariant(): Variant {
  return { sku: "", title: "", price: "", pricePro: "", proExempt: false, stock: "0", weight: "0" };
}

function autoSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [form, setForm] = useState({
    title: product?.title ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    isArchived: product?.isArchived ?? false,
    isFeatured: product?.isFeatured ?? false,
    isExclusive: product?.isExclusive ?? false,
    earlyAccessTierLevel: product?.earlyAccessTierLevel?.toString() ?? "",
    noReturns: product?.noReturns ?? true,
    probabilityData: product?.probabilityData
      ? JSON.stringify(product.probabilityData, null, 2)
      : "",
  });

  const [variants, setVariants] = useState<Variant[]>(
    product?.variants.length ? product.variants : [emptyVariant()]
  );

  const [images, setImages] = useState<ProductImage[]>(
    product?.images ?? []
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");

  // ── Form helpers ────────────────────────────────────────────────────────────

  function set(k: string, v: unknown) { setForm((f) => ({ ...f, [k]: v })); }

  function addVariant() { setVariants((v) => [...v, emptyVariant()]); }
  function removeVariant(i: number) {
    if (variants.length === 1) { toast.error("Debe haber al menos una variante"); return; }
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }
  function setVariant(i: number, k: keyof Variant, v: unknown) {
    setVariants((prev) => prev.map((vr, idx) => idx === i ? { ...vr, [k]: v } : vr));
  }

  // ── Image helpers ───────────────────────────────────────────────────────────

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) { toast.error("Introduce una URL de imagen"); return; }
    try { new URL(url); } catch { toast.error("La URL no es válida"); return; }
    setImages((imgs) => [
      ...imgs,
      { url, alt: newImageAlt.trim() || "", position: imgs.length },
    ]);
    setNewImageUrl("");
    setNewImageAlt("");
  }

  function removeImage(i: number) {
    setImages((imgs) => imgs.filter((_, idx) => idx !== i).map((img, idx) => ({ ...img, position: idx })));
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setImages(next.map((img, idx) => ({ ...img, position: idx })));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }
    if (variants.length === 0) { toast.error("Añade al menos una variante"); return; }
    if (variants.some((v) => !v.sku.trim() || !v.price.trim())) {
      toast.error("Todas las variantes deben tener SKU y precio");
      return;
    }

    let probabilityDataParsed: unknown = null;
    if (form.probabilityData.trim()) {
      try { probabilityDataParsed = JSON.parse(form.probabilityData); }
      catch { toast.error("El JSON de probabilidades no es válido"); return; }
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || autoSlug(form.title),
        description: form.description,
        categoryId: form.categoryId || null,
        isArchived: form.isArchived,
        isFeatured: form.isFeatured,
        isExclusive: form.isExclusive,
        earlyAccessTierLevel: form.earlyAccessTierLevel ? parseInt(form.earlyAccessTierLevel) : null,
        noReturns: form.noReturns,
        probabilityData: probabilityDataParsed,
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          title: v.title || null,
          price: parseFloat(v.price),
          pricePro: v.pricePro ? parseFloat(v.pricePro) : null,
          proExempt: v.proExempt,
          stock: parseInt(v.stock),
          weight: parseInt(v.weight),
        })),
        images: images.map((img, pos) => ({
          id: img.id,
          url: img.url,
          alt: img.alt || null,
          position: pos,
        })),
      };

      const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
      const method = product ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al guardar el producto");
        return;
      }

      toast.success(product ? "Producto actualizado" : "Producto creado");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    if (!product) return;
    const action = product.isArchived ? "restaurar" : "archivar";
    if (!confirm(`¿Seguro que quieres ${action} este producto?`)) return;

    setArchiving(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !product.isArchived }),
      });
      if (!res.ok) throw new Error();
      toast.success(product.isArchived ? "Producto restaurado" : "Producto archivado");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Error al archivar el producto");
    } finally {
      setArchiving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/products")}
        className="flex items-center gap-2 text-slate-300 hover:text-snow transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        <span className="text-sm">Volver a productos</span>
      </button>

      {/* ── Información básica ──────────────────────────────────────────────── */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow">Información básica</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-slate-300 mb-1.5">Título del producto</label>
            <input
              className={field}
              value={form.title}
              onChange={(e) => {
                set("title", e.target.value);
                if (!product) set("slug", autoSlug(e.target.value));
              }}
              placeholder="Deck Personalizado Premium"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Slug (URL)</label>
            <input
              className={`${field} font-mono`}
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="deck-personalizado-premium"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Categoría</label>
            <select
              className={field}
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-300 mb-1.5">Descripción</label>
            <textarea
              className={`${field} resize-none`}
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descripción detallada del producto..."
            />
          </div>
        </div>
      </div>

      {/* ── Imágenes ────────────────────────────────────────────────────────── */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-snow">Imágenes</h2>
          <span className="text-xs text-slate-300/60">{images.length} imagen{images.length !== 1 ? "es" : ""}</span>
        </div>

        {/* Grid de imágenes actuales */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative group rounded-[10px] overflow-hidden border border-white/8 bg-graphite-600/40 aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt || "Imagen del producto"}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />

                {/* Overlay de acciones */}
                <div className="absolute inset-0 bg-void-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveImage(i, i - 1)}
                      disabled={i === 0}
                      className="p-1.5 rounded-[6px] bg-graphite-600/80 text-slate-300 hover:text-snow disabled:opacity-30 transition-colors"
                      title="Mover a la izquierda"
                    >
                      <GripVertical size={12} />
                    </button>
                    <button
                      onClick={() => removeImage(i)}
                      className="p-1.5 rounded-[6px] bg-ember-red/20 text-ember-red hover:bg-ember-red/35 transition-colors"
                      title="Eliminar imagen"
                    >
                      <X size={12} />
                    </button>
                    <button
                      onClick={() => moveImage(i, i + 1)}
                      disabled={i === images.length - 1}
                      className="p-1.5 rounded-[6px] bg-graphite-600/80 text-slate-300 hover:text-snow disabled:opacity-30 transition-colors"
                      title="Mover a la derecha"
                    >
                      <GripVertical size={12} className="rotate-90" />
                    </button>
                  </div>
                  {i === 0 && (
                    <span className="text-[9px] font-bold text-mint-signal bg-mint-signal/15 px-2 py-0.5 rounded-full">
                      PORTADA
                    </span>
                  )}
                </div>

                {/* Badge posición */}
                <div className="absolute top-1.5 left-1.5 text-[9px] font-bold text-white/70 bg-void-black/60 rounded px-1.5 py-0.5">
                  #{i + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 border border-dashed border-white/10 rounded-[12px] gap-2">
            <ImageOff size={24} className="text-slate-300/30" />
            <p className="text-xs text-slate-300/50">Sin imágenes. Añade la URL de una imagen.</p>
          </div>
        )}

        {/* Añadir imagen por URL */}
        <div className="border-t border-white/8 pt-4 flex flex-col gap-3">
          <p className="text-xs font-medium text-slate-300">Añadir imagen por URL</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                className={field}
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/imagen.jpg"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
              />
            </div>
            <button
              onClick={addImage}
              className="flex items-center gap-1.5 px-3 py-2 bg-graphite-600/60 border border-white/10 rounded-[8px] text-sm text-snow hover:bg-graphite-500/60 transition-colors whitespace-nowrap"
            >
              <ImageIcon size={13} />
              Añadir
            </button>
          </div>
          <input
            className={field}
            value={newImageAlt}
            onChange={(e) => setNewImageAlt(e.target.value)}
            placeholder="Texto alternativo (opcional)"
          />
          <p className="text-xs text-slate-300/40">
            La primera imagen se usará como portada. Pasa el ratón sobre una imagen para reordenarla o eliminarla.
          </p>
        </div>
      </div>

      {/* ── Visibilidad ─────────────────────────────────────────────────────── */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow">Visibilidad y acceso</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">Nivel mínimo de early access (opcional)</label>
            <input
              className={field}
              type="number"
              min="1"
              max="5"
              value={form.earlyAccessTierLevel}
              onChange={(e) => set("earlyAccessTierLevel", e.target.value)}
              placeholder="Vacío = todos pueden ver"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { key: "isFeatured", label: "Producto destacado (aparece en la landing)" },
            { key: "isExclusive", label: "Producto exclusivo (requiere perk exclusiveProducts en el tier)" },
            { key: "noReturns", label: "Sin devoluciones (recomendado: activado)" },
            { key: "isArchived", label: "Archivado (oculto en la tienda)" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key as keyof typeof form] as boolean}
                onChange={(e) => set(key, e.target.checked)}
                className="w-4 h-4 rounded accent-mint-signal"
              />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Probabilidades ──────────────────────────────────────────────────── */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow">Tabla de probabilidades (JSON)</h2>
        <textarea
          className={`${field} font-mono resize-none`}
          rows={6}
          value={form.probabilityData}
          onChange={(e) => set("probabilityData", e.target.value)}
          placeholder={`{\n  "Común": "60%",\n  "Infrecuente": "30%",\n  "Rara": "10%"\n}`}
        />
        <p className="text-xs text-slate-300/50">JSON clave-valor. Vacío = sin tabla de probabilidades.</p>
      </div>

      {/* ── Variantes ───────────────────────────────────────────────────────── */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-snow">Variantes</h2>
        {variants.map((variant, i) => (
          <div key={i} className="border border-white/8 rounded-[12px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-300">Variante {i + 1}</p>
              <button
                onClick={() => removeVariant(i)}
                className="p-1 text-slate-300/40 hover:text-ember-red transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">SKU</label>
                <input
                  className={`${field} font-mono`}
                  value={variant.sku}
                  onChange={(e) => setVariant(i, "sku", e.target.value)}
                  placeholder="DECK-001"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Nombre variante</label>
                <input
                  className={field}
                  value={variant.title}
                  onChange={(e) => setVariant(i, "title", e.target.value)}
                  placeholder="Estándar"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Precio público (&euro;)</label>
                <input
                  className={field}
                  type="number"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => setVariant(i, "price", e.target.value)}
                  placeholder="29.99"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Precio PRO (&euro;, opcional)</label>
                <input
                  className={field}
                  type="number"
                  step="0.01"
                  value={variant.pricePro}
                  onChange={(e) => setVariant(i, "pricePro", e.target.value)}
                  placeholder="24.99"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Stock</label>
                <input
                  className={field}
                  type="number"
                  value={variant.stock}
                  onChange={(e) => setVariant(i, "stock", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Peso (g)</label>
                <input
                  className={field}
                  type="number"
                  value={variant.weight}
                  onChange={(e) => setVariant(i, "weight", e.target.value)}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={variant.proExempt}
                onChange={(e) => setVariant(i, "proExempt", e.target.checked)}
                className="w-4 h-4 rounded accent-mint-signal"
              />
              <span className="text-xs text-slate-300">PRO exempt (precio PRO sin consumir allowance)</span>
            </label>
          </div>
        ))}
        <button
          onClick={addVariant}
          className="flex items-center justify-center gap-2 w-full py-2.5 border border-dashed border-white/15 hover:border-white/30 rounded-[10px] text-sm text-slate-300 hover:text-snow transition-all"
        >
          <Plus size={13} />
          Añadir variante
        </button>
      </div>

      {/* ── Acciones ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pb-8">
        <Button onClick={handleSubmit} loading={loading}>
          <Save size={14} />
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>

        {product && (
          <button
            onClick={handleArchive}
            disabled={archiving}
            className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium transition-colors border ${
              product.isArchived
                ? "border-mint-signal/40 text-mint-signal hover:bg-mint-signal/10"
                : "border-white/10 text-slate-300 hover:text-snow hover:border-white/20"
            }`}
          >
            {product.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {product.isArchived ? "Restaurar producto" : "Archivar producto"}
          </button>
        )}
      </div>
    </div>
  );
}
