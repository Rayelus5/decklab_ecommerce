"use client";

import { useState } from "react";
import { IncubatorSection } from "./incubator-section";
import { InventoryBoxes } from "./inventory-boxes";
import { PokemonedasShop } from "./pokemonedas-shop";
import { ItemsShopWip } from "./items-shop-wip";
import { BattlesWip } from "./battles-wip";
import { Egg, Store, Swords } from "lucide-react";
import { clsx } from "clsx";

interface Props {
  userId: string;
  eggs: any[];
  incubator: any;
  pokemons: any[];
  boxesUnlocked: number;
  balance: number;
  pokemonedas: number;
}

export function GamificationTabs({
  userId,
  eggs,
  incubator,
  pokemons,
  boxesUnlocked,
  balance,
  pokemonedas,
}: Props) {
  const [activeTab, setActiveTab] = useState<"collection" | "shop" | "battles">("collection");

  return (
    <div className="flex flex-col gap-8 mt-4">
      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("collection")}
          className={clsx(
            "flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative",
            activeTab === "collection"
              ? "text-amber-400"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Egg size={18} />
          Mi Colección
          {activeTab === "collection" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("shop")}
          className={clsx(
            "flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative",
            activeTab === "shop"
              ? "text-amber-400"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Store size={18} />
          Tiendas
          {activeTab === "shop" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("battles")}
          className={clsx(
            "flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative",
            activeTab === "battles"
              ? "text-red-400"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Swords size={18} />
          Batallas
          {activeTab === "battles" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-400" />
          )}
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === "collection" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          <div className="flex flex-col gap-6">
            <IncubatorSection eggs={eggs} incubator={incubator} userId={userId} />
          </div>
          <div className="lg:col-span-2">
            <InventoryBoxes pokemons={pokemons} boxesUnlocked={boxesUnlocked} userId={userId} />
          </div>
        </div>
      )}

      {activeTab === "shop" && (
        <div className="flex flex-col gap-10 animate-in fade-in duration-300">
          <PokemonedasShop userId={userId} balance={balance} pokemonedas={pokemonedas} />
          <ItemsShopWip />
        </div>
      )}

      {activeTab === "battles" && (
        <div className="animate-in fade-in duration-300">
          <BattlesWip />
        </div>
      )}
    </div>
  );
}
