import Link from "next/link";
import type { Metadata } from "next";
import { Search, ShoppingBag, Home } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export const metadata: Metadata = {
  title: "Página no encontrada — DECKLAB",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center justify-center px-4">
      {/* Número 404 decorativo */}
      <div className="select-none mb-6 relative">
        <span
          className="text-[120px] sm:text-[180px] font-black text-white/[0.03] leading-none tracking-tighter"
          aria-hidden="true"
        >
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-[16px] bg-graphite-700 border border-white/10 flex items-center justify-center shadow-lg">
            <Search size={24} className="text-slate-300" />
          </div>
        </div>
      </div>

      {/* Mensaje */}
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-semibold text-snow mb-2">
          Página no encontrada
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          La página que buscas no existe o ha sido movida.
          Si crees que es un error, contacta con soporte.
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[8px] bg-ash-50 text-graphite-700 text-sm font-medium hover:bg-white transition-colors"
        >
          <Home size={15} />
          Ir al inicio
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[8px] bg-white/5 border border-white/10 text-snow text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <ShoppingBag size={15} />
          Ver la tienda
        </Link>
      </div>

      {/* Volver atrás */}
      <BackButton />
    </div>
  );
}
