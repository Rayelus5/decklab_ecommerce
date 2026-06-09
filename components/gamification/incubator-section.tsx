"use client";

import { useState, useEffect } from "react";
import { startIncubation, hatchEgg, INCUBATION_TIMES } from "@/lib/gamification";
import { useRouter } from "next/navigation";
import { EggRarity, PokemonEgg, UserIncubator } from "@prisma/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  eggs: PokemonEgg[];
  incubator: UserIncubator | null;
  userId: string;
}

export function IncubatorSection({ eggs, incubator, userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const incubatingEgg = eggs.find((e) => e.status === "INCUBATING");
  const inventoryEggs = eggs.filter((e) => e.status === "INVENTORY");

  // Timer logic for incubating egg
  useEffect(() => {
    if (!incubatingEgg || !incubatingEgg.incubatedAt) {
      setTimeLeft(null);
      return;
    }

    const requiredMinutes = INCUBATION_TIMES[incubatingEgg.rarity as EggRarity];
    const hatchTime = new Date(incubatingEgg.incubatedAt).getTime() + requiredMinutes * 60 * 1000;

    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = hatchTime - now;
      if (remaining <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(Math.floor(remaining / 1000)); // en segundos
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [incubatingEgg]);

  const handleIncubate = async (eggId: string) => {
    setLoading(true);
    const res = await startIncubation(userId, eggId);
    if (res.success) {
      toast.success("¡Huevo puesto en la incubadora!");
      router.refresh();
    } else {
      toast.error(res.error || "Error al incubar.");
    }
    setLoading(false);
  };

  const handleHatch = async (eggId: string) => {
    setLoading(true);
    const res = await hatchEgg(userId, eggId);
    if (res.success) {
      toast.success("¡Tu huevo ha eclosionado!");
      router.refresh();
    } else {
      toast.error(res.error || "Error al eclosionar.");
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Incubadora */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
        <h2 className="text-lg font-semibold text-snow">Incubadora</h2>
        
        {incubatingEgg ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border-2 border-amber-500/50 animate-pulse">
              <span className="text-4xl">🥚</span>
            </div>
            <p className="text-sm font-medium text-amber-400">Incubando ({incubatingEgg.rarity})</p>
            {timeLeft !== null && (
              <div className="text-snow font-mono text-xl">
                {timeLeft > 0 ? (
                  formatTime(timeLeft)
                ) : (
                  <button
                    onClick={() => handleHatch(incubatingEgg.id)}
                    disabled={loading}
                    className="bg-mint-signal hover:bg-mint-signal/80 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "¡Eclosionar!"}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border-2 border-dashed border-white/20">
              <span className="text-white/20 text-xs">Vacia</span>
            </div>
            <p className="text-sm text-slate-400 text-center">Tu incubadora infinita está libre.</p>
          </div>
        )}
      </div>

      {/* Huevos en Inventario */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-snow">Mis Huevos</h2>
        {inventoryEggs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No tienes huevos sin incubar.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
            {inventoryEggs.map((egg) => (
              <div key={egg.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2">
                <span className="text-3xl">🥚</span>
                <span className="text-xs font-semibold text-slate-300">{egg.rarity}</span>
                <button
                  onClick={() => handleIncubate(egg.id)}
                  disabled={loading || !!incubatingEgg}
                  className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs py-1.5 rounded-lg font-medium transition-colors"
                >
                  Incubar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
