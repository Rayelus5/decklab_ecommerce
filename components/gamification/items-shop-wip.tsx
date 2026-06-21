"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageOpen, Egg, Zap, Coins, Info } from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import { buyShopItem } from "@/lib/gamification";
import { SHOP_ITEMS, ShopItemType } from "@/lib/gamification-constants";

interface ShopItemConfig {
  type: ShopItemType | null;
  name: string;
  description: string;
  price: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  borderColor: string;
  active: boolean;
}

const SHOP_ITEMS_UI: ShopItemConfig[] = [
  {
    type: "MYSTERY_EGG",
    name: "Huevo Misterioso",
    description: "Un huevo de rareza desconocida aparecerá en tu inventario. ¡Puede ser cualquier cosa!",
    price: SHOP_ITEMS.MYSTERY_EGG.pkmPrice,
    icon: Egg,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    active: true,
  },
  {
    type: "BOX_EXPANSION",
    name: "Ticket de Expansión",
    description: "Desbloquea 8 cajas adicionales para tu colección. Máximo 24 cajas en total.",
    price: SHOP_ITEMS.BOX_EXPANSION.pkmPrice,
    icon: PackageOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    active: true,
  },
  {
    type: null,
    name: "Mejora de Incubadora",
    description: "Incuba dos huevos simultáneamente. Próximamente disponible.",
    price: 15_000,
    icon: Zap,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    active: false,
  },
];

interface Props {
  userId: string;
  pokemonedas: number;
}

export function ItemsShop({ userId, pokemonedas }: Props) {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<ShopItemType | null>(null);

  async function handleBuy(item: ShopItemConfig) {
    if (!item.active || !item.type) return;
    if (pokemonedas < item.price) {
      toast.error(`Necesitas ${item.price.toLocaleString("es-ES")} PKM para esto.`);
      return;
    }

    setLoadingType(item.type);
    const res = await buyShopItem(userId, item.type);
    setLoadingType(null);

    if (res.success) {
      if (item.type === "MYSTERY_EGG") {
        toast.success("¡Huevo Misterioso añadido a tu inventario!");
      } else if (item.type === "BOX_EXPANSION") {
        toast.success("¡8 nuevas cajas desbloqueadas!");
      }
      router.refresh();
    } else {
      toast.error(res.error ?? "No se pudo completar la compra.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-snow flex items-center gap-2">
            <PackageOpen className="text-blue-400" />
            Tienda de Objetos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gasta tus Pokémonedas en objetos especiales para tu aventura.
          </p>
        </div>

        {/* Saldo actual */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Coins size={16} className="text-amber-400" />
          <span className="text-amber-400 font-bold tabular-nums">
            {pokemonedas.toLocaleString("es-ES")} PKM
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SHOP_ITEMS_UI.map((item) => {
          const canAfford = pokemonedas >= item.price;
          const isLoading = loadingType === item.type;
          const isDisabled = !item.active || !canAfford || isLoading;

          return (
            <div
              key={item.name}
              className={clsx(
                "relative bg-graphite-700/40 border rounded-2xl p-5 flex flex-col items-center gap-4 text-center transition-all duration-200",
                item.active
                  ? canAfford
                    ? "border-white/8 hover:border-white/20 hover:-translate-y-0.5"
                    : "border-white/8 opacity-60"
                  : "border-white/5 opacity-40 grayscale-[60%]"
              )}
            >
              {/* Icono */}
              <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center border", item.bg, item.borderColor)}>
                <item.icon className={item.color} size={24} />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold text-snow text-sm leading-tight">{item.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                <p className="text-xs font-bold text-amber-400 mt-0.5">
                  {item.price.toLocaleString("es-ES")} PKM
                </p>
              </div>

              {/* Botón */}
              {item.active ? (
                <button
                  onClick={() => handleBuy(item)}
                  disabled={isDisabled}
                  className={clsx(
                    "w-full text-xs font-bold py-2.5 rounded-xl border transition-all",
                    isLoading
                      ? "bg-white/5 border-white/10 text-slate-400 cursor-wait"
                      : canAfford
                      ? "bg-amber-500 border-amber-400 text-black hover:bg-amber-400 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      : "bg-white/5 border-white/10 text-slate-500 cursor-not-allowed"
                  )}
                >
                  {isLoading ? "Comprando…" : canAfford ? "Comprar" : "PKM insuficientes"}
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 py-2.5 rounded-xl border border-white/5 bg-white/3">
                  <Info size={12} />
                  Próximamente
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
