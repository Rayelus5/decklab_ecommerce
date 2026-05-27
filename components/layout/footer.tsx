import Link from "next/link";
import { Layers } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/8 bg-deep-charcoal/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-graphite-500 border border-white/15 rounded-[5px] flex items-center justify-center">
              <Layers size={12} className="text-ash-50" />
            </div>
            <span className="text-sm font-semibold text-snow">DECKLAB</span>
            <span className="text-xs text-slate-300">— Pokémon TCG Premium</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-4" aria-label="Enlaces de pie de página">
            <Link
              href="/products"
              className="text-xs text-slate-300 hover:text-snow transition-colors"
            >
              Tienda
            </Link>
            <Link
              href="/pricing"
              className="text-xs text-slate-300 hover:text-snow transition-colors"
            >
              PRO
            </Link>
            <span className="text-xs text-slate-300/40" aria-hidden="true">·</span>
            <span className="text-xs text-slate-300/60">
              Sin devoluciones · Aleatoriedad verificada
            </span>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-slate-300/40">
            &copy; {currentYear} DECKLAB. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
