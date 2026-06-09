import { prisma } from "@/lib/prisma";
import { VipTierForm } from "./vip-tier-form";
import { Star } from "lucide-react";

export default async function AdminVipTiersPage() {
  const tiers = await prisma.vipTier.findMany({
    orderBy: { level: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-snow flex items-center gap-2">
            <Star className="text-amber-400" /> Niveles VIP
          </h1>
          <p className="text-sm text-slate-400 mt-1">Gestiona los niveles VIP y sus beneficios (Cashback).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-snow">Niveles Existentes</h2>
          {tiers.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay niveles VIP creados.</p>
          ) : (
            tiers.map((tier) => (
              <div key={tier.id} className="bg-graphite-700/50 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-snow" style={{ color: tier.color }}>
                    Nivel {tier.level}: {tier.name}
                  </span>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md font-semibold">
                    {tier.cashbackPercent.toString()}% Cashback
                  </span>
                </div>
                <div className="text-sm text-slate-400 flex gap-4 mt-2">
                  <span>Mín. Gasto: <strong className="text-snow">{tier.minSpent.toString()}€</strong></span>
                  <span>Mín. Pedidos: <strong className="text-snow">{tier.minOrders}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-graphite-700/30 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-snow mb-4">Añadir Nuevo Nivel</h2>
          <VipTierForm />
        </div>
      </div>
    </div>
  );
}
