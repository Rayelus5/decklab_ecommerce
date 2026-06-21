"use client";

import { useState, useEffect } from "react";
import { startIncubation, hatchEgg } from "@/lib/gamification";
import { useRouter } from "next/navigation";
import { PokemonEgg, UserIncubator } from "@prisma/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  eggs: PokemonEgg[];
  incubator: UserIncubator | null;
  userId: string;
  hatchDeadlineMs: number | null;
}

const RARITY_COLORS: Record<string, { bg: string, border: string, text: string, hex: string }> = {
  COMMON: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-300", hex: "64748b" },
  UNCOMMON: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", hex: "10b981" },
  RARE: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", hex: "3b82f6" },
  EPIC: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", hex: "a855f7" },
  LEGENDARY: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", hex: "f59e0b" },
  MYTHIC: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", hex: "f43f5e" },
};

export function IncubatorSection({ eggs, incubator, userId, hatchDeadlineMs }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const incubatingEgg = eggs.find((e) => e.status === "INCUBATING");
  const inventoryEggs = eggs.filter((e) => e.status === "INVENTORY");

  // Timer basado en hatchDeadlineMs (número UTC absoluto calculado en el servidor)
  // Evita ambigüedad de zona horaria al no hacer Date parsing en el cliente
  useEffect(() => {
    if (!incubatingEgg || hatchDeadlineMs === null) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = hatchDeadlineMs - Date.now();
      setTimeLeft(remaining <= 0 ? 0 : Math.floor(remaining / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [incubatingEgg, hatchDeadlineMs]);

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
            <div className={`w-24 h-29 ${RARITY_COLORS[incubatingEgg.rarity]?.bg || "bg-white/5"} rounded-full flex items-center justify-center border-2 p-1 ${RARITY_COLORS[incubatingEgg.rarity]?.border || "border-amber-500/50"} animate-pulse overflow-hidden`}>
              <img src="https://lh3.googleusercontent.com/l0SDuwjq-xKQLCFyja464SEgU3CQhouF1YuEI_81sAYNesICjMTq01ATE7p26qAz0LcgKf-EAnXN7B9vPruPENigknvyzIqsAiJF=e365-pa-nu-w513"
              alt="Incubando Huevo" className="w-full h-full object-cover" />
            </div>
            <p className={`text-sm font-medium ${RARITY_COLORS[incubatingEgg.rarity]?.text || "text-amber-400"}`}>Incubando ({incubatingEgg.rarity})</p>
            {timeLeft !== null && (
              <div className="text-snow font-mono text-xl">
                {timeLeft > 0 ? (
                  formatTime(timeLeft)
                ) : (
                  <button
                    onClick={() => handleHatch(incubatingEgg.id)}
                    disabled={loading}
                    className="bg-mint-signal hover:bg-mint-signal/80 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors cursor-pointer"
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
            {inventoryEggs.map((egg) => {
              const colors = RARITY_COLORS[egg.rarity] || { bg: "bg-white/5", border: "border-white/10", text: "text-slate-300", hex: "FFFFFF" };
              return (
                <div key={egg.id} className={`${colors.bg} border ${colors.border} rounded-xl p-3 flex flex-col items-center gap-2 transition-colors`}>
                  <div className={`w-16 h-20 p-1 overflow-hidden`}>
                    <img src="https://lh3.googleusercontent.com/l0SDuwjq-xKQLCFyja464SEgU3CQhouF1YuEI_81sAYNesICjMTq01ATE7p26qAz0LcgKf-EAnXN7B9vPruPENigknvyzIqsAiJF=e365-pa-nu-w513" alt="Huevo" className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-xs font-bold ${colors.text}`}>{egg.rarity}</span>
                  <button
                    onClick={() => handleIncubate(egg.id)}
                    disabled={loading || !!incubatingEgg}
                    className={`w-full ${colors.bg} hover:brightness-125 border ${colors.border} disabled:opacity-50 text-white text-xs py-1.5 rounded-lg font-medium transition-all cursor-pointer`}
                  >
                    Incubar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
