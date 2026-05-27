import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Mail, Package, Truck, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Pedido confirmado — DECKLAB",
};

const NEXT_STEPS = [
  {
    Icon: Mail,
    text: "Recibirás un email de confirmación con la factura en PDF.",
  },
  {
    Icon: Package,
    text: "Prepararemos tu pedido en el menor tiempo posible.",
  },
  {
    Icon: Truck,
    text: "Al enviarlo, recibirás el número de tracking de Correos.",
  },
  {
    Icon: MessageCircle,
    text: "Seguimiento también disponible vía Telegram (@decklab_bot).",
  },
];

export default function OrderSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-8">
        {/* Icono */}
        <div className="w-20 h-20 rounded-full bg-mint-signal/15 border border-mint-signal/25 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-mint-signal" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-snow">Pedido confirmado</h1>
          <p className="text-slate-300 leading-relaxed">
            Tu pago ha sido procesado correctamente. Recibirás un email de confirmación con los detalles de tu pedido.
          </p>
        </div>

        {/* Pasos */}
        <div className="w-full bg-graphite-700/40 border border-white/8 rounded-[16px] p-5 flex flex-col gap-4 text-left">
          <p className="text-sm font-medium text-snow">Qué pasa ahora</p>
          <ul className="flex flex-col gap-3">
            {NEXT_STEPS.map(({ Icon, text }, i) => (
              <li key={i} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-[6px] bg-graphite-500 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-slate-300" />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/profile/orders"
            className="w-full px-6 py-3 bg-ash-50 hover:bg-white text-graphite-700 font-semibold text-sm rounded-[8px] transition-colors text-center"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/products"
            className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-snow font-medium text-sm rounded-[8px] transition-all text-center"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
