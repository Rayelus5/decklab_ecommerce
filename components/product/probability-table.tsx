interface ProbabilityEntry {
  rarity: string;
  probability: string;
  color?: string;
}

interface ProbabilityTableProps {
  data: Record<string, string> | ProbabilityEntry[];
  title?: string;
}

// Colores por rareza (heurísticos)
function getRarityColor(rarity: string): string {
  const r = rarity.toLowerCase();
  if (r.includes("shiny") || r.includes("especial")) return "text-yellow-400";
  if (r.includes("ex") || r.includes("gx") || r.includes("v-max") || r.includes("vmax"))
    return "text-purple-400";
  if (r.includes("rara") || r.includes("rare")) return "text-blue-400";
  if (r.includes("holográfica") || r.includes("holo")) return "text-cyan-400";
  if (r.includes("ultra")) return "text-amber-400";
  if (r.includes("común") || r.includes("common")) return "text-slate-400";
  if (r.includes("poco") || r.includes("uncommon")) return "text-green-400";
  return "text-slate-300";
}

export function ProbabilityTable({ data, title = "Probabilidades" }: ProbabilityTableProps) {
  // Normalizar los datos a array
  const entries: ProbabilityEntry[] = Array.isArray(data)
    ? data
    : Object.entries(data).map(([rarity, probability]) => ({ rarity, probability }));

  if (entries.length === 0) return null;

  return (
    <div className="bg-graphite-700/40 border border-white/8 rounded-[11px] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <span className="text-base" role="img" aria-hidden="true">🎲</span>
        <h3 className="text-sm font-semibold text-snow">{title}</h3>
      </div>

      <div className="divide-y divide-white/5">
        {entries.map((entry, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-white/3 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" aria-hidden="true" />
              <span className={`text-sm ${getRarityColor(entry.rarity)}`}>
                {entry.rarity}
              </span>
            </div>
            <span className="text-sm font-medium text-snow tabular-nums">
              {entry.probability}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 bg-graphite-600/30 border-t border-white/8">
        <p className="text-[10px] text-slate-300/60 text-center">
          Probabilidades certificadas · Randomización verificada y sin manipulación
        </p>
      </div>
    </div>
  );
}
