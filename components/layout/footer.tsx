import Link from "next/link";
import { Layers } from "lucide-react";

const LEGAL_LINKS = [
  { href: "/legal/aviso-legal", label: "Aviso legal" },
  { href: "/legal/privacidad", label: "Privacidad" },
  { href: "/legal/envios", label: "Envíos" },
  { href: "/legal/reembolsos", label: "Reembolsos" },
  { href: "/legal/descargo", label: "Descargo" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/8 bg-deep-charcoal/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Top row: logo + nav tienda */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-graphite-500 border border-white/15 rounded-[5px] flex items-center justify-center">
              <Layers size={12} className="text-ash-50" />
            </div>
            <span className="text-sm font-semibold text-snow">DECKLAB</span>
            <span className="text-xs text-slate-300">— Pokémon TCG Premium</span>
          </div>

          {/* Links tienda */}
          <nav className="flex items-center gap-4" aria-label="Navegación principal">
            <Link href="/products" className="cursor-pointer text-xs text-slate-300 hover:text-snow transition-colors">
              Tienda
            </Link>
            <Link href="/pricing" className="cursor-pointer text-xs text-slate-300 hover:text-snow transition-colors">
              PRO
            </Link>
            <span className="text-xs text-slate-300/40" aria-hidden="true">·</span>
            <span className="text-xs text-slate-300/60">Sin devoluciones · Aleatoriedad verificada</span>
          </nav>
        </div>

        {/* Legal links */}
        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          aria-label="Información legal"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="cursor-pointer text-[11px] text-slate-300/50 hover:text-slate-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Disclaimer + copyright */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[10px] text-slate-300/35 leading-relaxed max-w-lg">
            DECKLAB no está afiliado ni asociado con The Pokémon Company, Nintendo ni Game Freak.
            Pokémon y todos los nombres relacionados son marcas registradas de sus respectivos propietarios.
          </p>
          <p className="text-[10px] text-slate-300/30">
            &copy; {currentYear} DECKLAB. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
