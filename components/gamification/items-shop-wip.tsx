import { PackageOpen, Lock, HardHat } from "lucide-react";
import { clsx } from "clsx";

const WIP_ITEMS = [
  { id: "item-1", name: "Ticket de Expansión de Caja", price: 5000, icon: PackageOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "item-2", name: "Mejora de Incubadora", price: 15000, icon: Lock, color: "text-purple-400", bg: "bg-purple-500/10" },
  { id: "item-3", name: "Huevo Misterioso", price: 3000, icon: Lock, color: "text-amber-400", bg: "bg-amber-500/10" },
];

export function ItemsShopWip() {
  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-snow flex items-center gap-2">
            <PackageOpen className="text-blue-400" />
            Tienda de Objetos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gasta tus pokemonedas en objetos especiales para tu aventura.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {WIP_ITEMS.map((item) => (
          <div key={item.id} className="relative bg-graphite-700/40 border border-white/8 rounded-2xl p-5 flex flex-col items-center gap-4 text-center overflow-hidden opacity-60 grayscale-[50%]">
            <div className={clsx("w-14 h-14 rounded-full flex items-center justify-center border border-white/10", item.bg)}>
              <item.icon className={item.color} size={24} />
            </div>
            <div>
              <h3 className="font-bold text-snow text-sm leading-tight">{item.name}</h3>
              <p className="text-xs font-semibold text-amber-400 mt-1">{item.price.toLocaleString("es-ES")} PKM</p>
            </div>
            <button disabled className="w-full bg-white/5 border border-white/10 text-slate-500 text-xs font-bold py-2 rounded-lg cursor-not-allowed">
              Comprar
            </button>
          </div>
        ))}
      </div>

      {/* Overlay WIP */}
      <div className="absolute inset-0 bg-graphite-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-3xl border border-white/5">
        <div className="bg-graphite-800 border border-white/10 px-6 py-4 rounded-2xl flex flex-col items-center gap-2 shadow-2xl shadow-black/50">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 text-amber-400 mb-1">
            <HardHat size={24} />
          </div>
          <h3 className="text-lg font-bold text-snow">En Construcción</h3>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            Estamos preparando el stock para la tienda de objetos. ¡Vuelve pronto!
          </p>
        </div>
      </div>
    </div>
  );
}
