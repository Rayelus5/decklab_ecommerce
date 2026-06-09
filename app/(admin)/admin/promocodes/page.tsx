import { prisma } from "@/lib/prisma";
import { PromoCodeForm } from "./promocode-form";
import { Gift } from "lucide-react";

export default async function AdminPromoCodesPage() {
  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-snow flex items-center gap-2">
            <Gift className="text-mint-signal" /> Códigos Promocionales (Huevos)
          </h1>
          <p className="text-sm text-slate-400 mt-1">Genera códigos para regalar huevos Pokémon a los clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-graphite-700/30 border border-white/10 rounded-xl p-6 h-fit">
          <h2 className="text-lg font-semibold text-snow mb-4">Generar Código</h2>
          <PromoCodeForm />
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-snow">Últimos 50 Códigos</h2>
          <div className="bg-graphite-700/50 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-black/20 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Recompensa</th>
                  <th className="px-4 py-3">Rareza</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Creado</th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay códigos generados.
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono text-snow">{code.code}</td>
                      <td className="px-4 py-3">{code.rewardType}</td>
                      <td className="px-4 py-3 font-semibold">{code.rarity}</td>
                      <td className="px-4 py-3">
                        {code.isUsed ? (
                          <span className="text-ember-red">Usado</span>
                        ) : (
                          <span className="text-mint-signal">Disponible</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
