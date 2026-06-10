"use client";

import { useState } from "react";
import { Crown, Info, X, ChevronRight, CheckCircle2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface VipTier {
  id: string;
  level: number;
  name: string;
  minSpent: any;
  minOrders: number;
  cashbackPercent: any;
  color: string;
  iconImage: string;
}

interface Props {
  tiers: VipTier[];
  userTierId?: string | null;
  totalSpent: number;
  totalOrdersCount: number;
}

export function VipInfoModal({ tiers, userTierId, totalSpent, totalOrdersCount }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <Crown size={14} className="text-amber-400" />
          <span className="text-xs font-bold text-snow tracking-wider">VIP</span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-graphite-800 border border-white/10 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 p-6 md:p-8">
          
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                <Crown size={20} className="text-amber-400" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-snow">Sistema VIP DECKLAB</Dialog.Title>
                <Dialog.Description className="text-sm text-slate-400">
                  Descubre cómo funcionan los Niveles VIP y las recompensas exclusivas.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="cursor-pointer text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full p-2">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex gap-3 text-sm text-sky-200">
              <Info size={20} className="text-sky-400 shrink-0" />
              <p>
                <strong>¿Cómo funciona?</strong> Cada vez que realizas un pedido, el sistema suma tu gasto total histórico y la cantidad de pedidos que has hecho. Al alcanzar los requisitos de un nivel, ascenderás automáticamente y recibirás <strong>Cashback (Saldo PRO)</strong> en todas tus futuras compras correspondientes a tu porcentaje VIP.
              </p>
            </div>

            {/* Progreso Actual del Usuario */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Tu Progreso Actual</p>
                <p className="text-2xl font-mono font-bold text-snow">{totalSpent.toFixed(2)}€</p>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="text-center sm:text-left">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Pedidos Totales</p>
                <p className="text-2xl font-mono font-bold text-snow">{totalOrdersCount}</p>
              </div>
            </div>

            {/* Listado de Tiers */}
            <div className="flex flex-col gap-3">
              <h3 className="font-semibold text-snow mb-2">Recorrido VIP</h3>
              {tiers.length === 0 ? (
                <p className="text-sm text-slate-400">Pronto anunciaremos los niveles VIP.</p>
              ) : (
                tiers.map((tier, idx) => {
                  const isCurrent = tier.id === userTierId;
                  const isUnlocked = totalSpent >= tier.minSpent && totalOrdersCount >= tier.minOrders;
                  
                  return (
                    <div 
                      key={tier.id}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isCurrent 
                          ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                          : isUnlocked
                            ? "bg-white/5 border-white/20"
                            : "bg-black/20 border-white/5 opacity-60"
                      }`}
                    >
                      {/* Indicador de Nivel */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-12">
                        <span className="text-xs font-bold text-slate-500">LVL</span>
                        <span className={`text-xl font-black ${isUnlocked ? "text-snow" : "text-slate-600"}`}>
                          {tier.level}
                        </span>
                      </div>

                      <div className="w-px h-10 bg-white/10 shrink-0" />

                      {/* Info del Nivel */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 
                            className="font-bold uppercase tracking-wider text-lg truncate"
                            style={{ color: isUnlocked ? tier.color : undefined }}
                          >
                            {tier.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                              Actual
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1">
                          <span className={isUnlocked ? "text-slate-300" : "text-slate-500"}>
                            Gasto Mín: <strong>{tier.minSpent.toString()}€</strong>
                          </span>
                          <span className={isUnlocked ? "text-slate-300" : "text-slate-500"}>
                            Pedidos: <strong>{tier.minOrders}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Recompensa */}
                      <div className="shrink-0 flex flex-col items-end">
                        <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                          +{tier.cashbackPercent.toString()}%
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Cashback</span>
                      </div>

                      {/* Check if unlocked */}
                      {isUnlocked && !isCurrent && (
                        <div className="absolute -right-2 -top-2 bg-graphite-800 rounded-full">
                          <CheckCircle2 size={20} className="text-mint-signal" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
