"use client";

import { useState } from "react";
import { X, Truck, Tag, ShieldCheck, CreditCard, Smartphone } from "lucide-react";
import Image from "next/image";

interface MarketplaceInfoModalProps {
  platform: "WALLAPOP" | "VINTED";
}

export function MarketplaceInfoModal({ platform }: MarketplaceInfoModalProps) {
  const [open, setOpen] = useState(false);

  const platformLabel = platform === "WALLAPOP" ? "Wallapop" : "Vinted";
  const iconPath = platform === "WALLAPOP" ? "/wallapop.webp" : "/vinted.webp";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="cursor-pointer p-1 rounded-full text-slate-400 hover:text-snow hover:bg-white/8 transition-colors"
        aria-label={`Info sobre envío ${platformLabel}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-md bg-graphite-700 border border-white/12 rounded-[20px] p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src={iconPath}
                  alt={platformLabel}
                  width={24}
                  height={24}
                  className="object-contain"
                  onError={() => {}}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-snow">Envío por {platformLabel}</h3>
                <p className="text-xs text-slate-400">¿Cómo funciona?</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer ml-auto p-1.5 rounded-full text-slate-400 hover:text-snow hover:bg-white/8 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Ventaja principal */}
            <div className="bg-white/4 border border-white/8 rounded-[12px] p-4 flex gap-3">
              <Truck size={16} className="text-mint-signal shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-snow mb-1">
                  Precios exclusivos de Correos
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {platformLabel} tiene un convenio especial con Correos que permite envíos con seguimiento a precios mucho más baratos que los de particular.
                </p>
              </div>
            </div>

            {/* Opciones de pago */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Elige cómo pagar</p>

              {/* Opción WEB */}
              <div className="bg-white/3 border border-white/8 rounded-[12px] p-4 flex gap-3">
                <CreditCard size={16} className="text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-snow">Pagar aquí</p>
                    <span className="text-[10px] font-semibold text-mint-signal bg-mint-signal/10 border border-mint-signal/20 px-1.5 py-0.5 rounded-full">
                      −1€
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pagas los productos en la web con <strong className="text-snow">1€ de descuento</strong>. Recibirás un anuncio de 1€ en {platformLabel} para comprar el envío con seguimiento de Correos.
                  </p>
                </div>
              </div>

              {/* Opción PLATFORM */}
              <div className="bg-white/3 border border-white/8 rounded-[12px] p-4 flex gap-3">
                <Smartphone size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-snow mb-1">Pagar en {platformLabel}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    No pagas nada ahora. El equipo creará un anuncio en {platformLabel} con el total de tu pedido. Puedes comprarlo desde allí junto con el envío directamente en la plataforma.
                  </p>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <ShieldCheck size={13} className="text-mint-signal shrink-0 mt-0.5" />
                <p>Tu nivel VIP y cashback se calculan igual con ambas opciones.</p>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <Tag size={13} className="text-sky-400 shrink-0 mt-0.5" />
                <p>Siempre con número de seguimiento de Correos.</p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer w-full py-2.5 rounded-[10px] bg-white/8 hover:bg-white/12 text-sm text-snow font-medium transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
