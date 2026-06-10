"use client";

import { useState } from "react";
import { Coins, Loader2, ArrowRightLeft, CreditCard } from "lucide-react";
import { buyPokemonedas, redeemPokemonedas } from "@/lib/gamification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

interface Props {
  userId: string;
  balance: number;
  pokemonedas: number;
}

const BUY_PACKS = [
  { id: "pack-1", pk: 1000, eur: 1 },
  { id: "pack-2", pk: 3000, eur: 3 },
  { id: "pack-3", pk: 5000, eur: 5 },
  { id: "pack-4", pk: 10000, eur: 10, best: true },
];

const REDEEM_PACKS = [
  { id: "red-1", pk: 1500, eur: 1 },
  { id: "red-2", pk: 7500, eur: 5 },
  { id: "red-3", pk: 15000, eur: 10 },
];

export function PokemonedasShop({ userId, balance, pokemonedas }: Props) {
  const router = useRouter();
  const [loadingBuy, setLoadingBuy] = useState<string | null>(null);
  const [loadingRedeem, setLoadingRedeem] = useState<string | null>(null);

  const handleBuy = async (eur: number, id: string) => {
    setLoadingBuy(id);
    const res = await buyPokemonedas(userId, eur);
    if (res.success) {
      toast.success(`¡Has comprado ${eur * 1000} Pokemonedas!`);
      router.refresh();
    } else {
      toast.error(res.error || "Error al comprar Pokemonedas.");
    }
    setLoadingBuy(null);
  };

  const handleRedeem = async (eur: number, id: string) => {
    setLoadingRedeem(id);
    const res = await redeemPokemonedas(userId, eur);
    if (res.success) {
      toast.success(`¡Has canjeado ${eur * 1500} Pokemonedas por ${eur}€ de saldo PRO!`);
      router.refresh();
    } else {
      toast.error(res.error || "Error al canjear Pokemonedas.");
    }
    setLoadingRedeem(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-snow flex items-center gap-2">
            <Coins className="text-amber-400" />
            Banco de Pokemonedas
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Las pokemonedas son la moneda virtual de DECKLAB. Puedes adquirirlas con tu saldo PRO o canjearlas de vuelta por saldo. No tienen valor fiduciario real.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-graphite-800/80 p-3 rounded-xl border border-white/10 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Saldo PRO</span>
            <span className="text-sm font-semibold text-snow">{balance.toFixed(2)} €</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-amber-500/80 font-bold uppercase">Pokemonedas</span>
            <span className="text-sm font-bold text-amber-400">{pokemonedas}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COMPRAR POKEMONEDAS */}
        <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <CreditCard className="text-amber-400" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-snow">Comprar Pokemonedas</h3>
              <p className="text-xs text-slate-400">1€ Saldo PRO = 1.000 PKM</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {BUY_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={clsx(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  pack.best ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10"
                )}
              >
                {pack.best && (
                  <span className="absolute -top-2.5 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Mejor Opción
                  </span>
                )}
                <span className="text-lg font-black text-amber-400 tracking-tight">{pack.pk.toLocaleString("es-ES")}</span>
                <button
                  onClick={() => handleBuy(pack.eur, pack.id)}
                  disabled={!!loadingBuy || balance < pack.eur}
                  className="w-full mt-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/10 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loadingBuy === pack.id ? <Loader2 size={14} className="animate-spin" /> : `${pack.eur}€`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CANJEAR POKEMONEDAS */}
        <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ArrowRightLeft className="text-emerald-400" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-snow">Canjear por Saldo PRO</h3>
              <p className="text-xs text-slate-400">1.500 PKM = 1€ Saldo PRO</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            {REDEEM_PACKS.map((pack) => (
              <div key={pack.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-400">+{pack.eur}€ Saldo PRO</span>
                  <span className="text-xs text-slate-400">Cuesta {pack.pk.toLocaleString("es-ES")} PKM</span>
                </div>
                <button
                  onClick={() => handleRedeem(pack.eur, pack.id)}
                  disabled={!!loadingRedeem || pokemonedas < pack.pk}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center justify-center min-w-[80px]"
                >
                  {loadingRedeem === pack.id ? <Loader2 size={14} className="animate-spin" /> : "Canjear"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
