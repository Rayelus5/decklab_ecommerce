import { Swords, Trophy, Shield, Users } from "lucide-react";

export function BattlesWip() {
  return (
    <div className="flex flex-col gap-6 relative min-h-[400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-snow flex items-center gap-2">
            <Swords className="text-red-400" />
            Arena de Batallas
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Enfrenta a tus mejores Pokémon contra otros entrenadores de la comunidad.
          </p>
        </div>
      </div>

      {/* Decorative blurred background content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 grayscale-[70%]">
        <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Users className="text-red-400" size={32} />
          </div>
          <div>
            <h3 className="font-bold text-snow">Partida Rápida</h3>
            <p className="text-xs text-slate-400 mt-1">Emparejamiento aleatorio por nivel</p>
          </div>
          <button disabled className="w-full mt-2 bg-white/5 border border-white/10 text-slate-500 text-xs font-bold py-2 rounded-lg cursor-not-allowed">
            Buscar Rival
          </button>
        </div>

        <div className="bg-graphite-700/40 border border-white/8 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy className="text-amber-400" size={32} />
          </div>
          <div>
            <h3 className="font-bold text-snow">Ligas Competitivas</h3>
            <p className="text-xs text-slate-400 mt-1">Asciende de rango y gana recompensas</p>
          </div>
          <button disabled className="w-full mt-2 bg-white/5 border border-white/10 text-slate-500 text-xs font-bold py-2 rounded-lg cursor-not-allowed">
            Ver Clasificación
          </button>
        </div>
      </div>

      {/* Overlay WIP */}
      <div className="absolute inset-0 bg-graphite-900/60 backdrop-blur-[3px] z-10 flex items-center justify-center rounded-3xl border border-white/5">
        <div className="bg-graphite-800 border border-white/10 px-8 py-6 rounded-3xl flex flex-col items-center gap-3 shadow-2xl shadow-black/50 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 text-red-400 mb-2">
            <Shield size={32} />
          </div>
          <h3 className="text-2xl font-black text-snow uppercase tracking-wider">Próximamente</h3>
          <p className="text-sm text-slate-400 max-w-sm">
            Nuestros ingenieros están construyendo la Arena de Batallas. ¡Prepara a tu equipo para los combates que están por venir!
          </p>
        </div>
      </div>
    </div>
  );
}
