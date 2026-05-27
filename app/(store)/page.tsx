import Link from "next/link";
import type { Metadata } from "next";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Waves } from "@/components/ui/wave-background";

export const metadata: Metadata = {
  title: "DECKLAB — Pokémon TCG Premium",
  description:
    "La tienda privada de Pokémon TCG personalizado. Acceso exclusivo para miembros de nuestra comunidad en Telegram.",
};

// Datos de beneficios PRO
const PRO_BENEFITS = [
  {
    icon: "🎯",
    title: "Allowance mensual",
    desc: "Crédito mensual para comprar al precio PRO exclusivo de cada nivel.",
  },
  {
    icon: "⚡",
    title: "Acceso anticipado",
    desc: "Disfruta de early access a nuevos productos horas antes que el resto.",
  },
  {
    icon: "🚚",
    title: "Envío gratuito",
    desc: "Envío sin coste en tiers superiores. Sin sorpresas en el checkout.",
  },
  {
    icon: "🔒",
    title: "Productos exclusivos",
    desc: "Acceso a colecciones y ediciones limitadas solo para miembros PRO.",
  },
];

// Datos de características
const FEATURES = [
  {
    icon: "🎲",
    title: "Aleatoriedad verificada",
    desc: "Todas las probabilidades están publicadas. Randomización justa y transparente.",
  },
  {
    icon: "📦",
    title: "Envío seguro",
    desc: "Embalaje profesional. Correos Certificado disponible para mayor seguridad.",
  },
  {
    icon: "🤝",
    title: "Comunidad privada",
    desc: "Solo miembros del grupo de Telegram. Una comunidad real de coleccionistas.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ============================================
          HERO — ShaderAnimation de fondo
      ============================================ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Shader animation (fondo) */}
        <div className="absolute inset-0">
          <ShaderAnimation />
        </div>

        {/* Overlay oscuro */}
        <div
          className="absolute inset-0 bg-void-black/60"
          aria-hidden="true"
        />

        {/* Contenido del hero */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/12 rounded-full text-xs text-slate-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-signal animate-pulse" />
            Tienda privada · Solo miembros verificados
          </div>

          {/* Título */}
          <div className="flex flex-col gap-3">
            <h1 className="text-5xl sm:text-7xl font-bold text-snow tracking-tight leading-none">
              DECKLAB
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
              La tienda de Pokémon TCG personalizado para{" "}
              <span className="text-ash-50 font-medium">coleccionistas serios.</span>
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/products"
              className="px-8 py-3.5 bg-ash-50 hover:bg-white text-graphite-700 font-semibold text-sm rounded-[8px] transition-colors text-center"
            >
              Ver la tienda
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-3.5 bg-white/8 hover:bg-white/12 border border-white/12 text-snow font-medium text-sm rounded-[8px] transition-all text-center backdrop-blur-sm"
            >
              Planes PRO
            </Link>
          </div>

          {/* Aviso Telegram */}
          <p className="text-xs text-slate-300/60 flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[#29B6F6]"
              aria-hidden="true"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Acceso exclusivo para miembros del grupo privado de Telegram
          </p>
        </div>

        {/* Flecha de scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============================================
          CARACTERÍSTICAS
      ============================================ */}
      <section className="py-20 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold text-snow">
              Por qué DECKLAB
            </h2>
            <p className="text-slate-300 mt-2">
              Transparencia y calidad en cada compra.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-6 flex flex-col gap-3"
              >
                <span className="text-3xl" role="img" aria-hidden="true">{f.icon}</span>
                <h3 className="text-base font-semibold text-snow">{f.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          BENEFICIOS PRO — con WaveBackground
      ============================================ */}
      <section className="py-20 px-4 relative overflow-hidden bg-graphite-700/20">
        {/* Wave background */}
        <div className="absolute inset-0 opacity-30">
          <Waves />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 mb-4">
              <span>👑</span>
              Suscripción PRO
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-snow">
              Lleva tu colección al siguiente nivel
            </h2>
            <p className="text-slate-300 mt-2 max-w-md mx-auto">
              5 niveles de suscripción con allowance mensual y perks exclusivos.
              Sin devoluciones, con toda la transparencia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {PRO_BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex gap-4 items-start bg-graphite-600/40 border border-white/8 rounded-[11px] p-4"
              >
                <span className="text-2xl shrink-0" role="img" aria-hidden="true">{b.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-snow">{b.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-ash-50 hover:bg-white text-graphite-700 font-semibold text-sm rounded-[8px] transition-colors"
            >
              Ver planes y precios
            </Link>
            <p className="text-xs text-slate-300/60 mt-3">
              Permanencia mínima de 2 meses · Facturación bimestral
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA FINAL
      ============================================ */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-[16px] bg-graphite-600 border border-white/10 flex items-center justify-center text-3xl">
            🎴
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-snow">
              ¿Listo para unirte?
            </h2>
            <p className="text-slate-300 mt-2 leading-relaxed">
              Únete al grupo de Telegram y verifica tu membresía para acceder a la tienda.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/login"
              className="flex-1 px-6 py-3 bg-ash-50 hover:bg-white text-graphite-700 font-semibold text-sm rounded-[8px] transition-colors text-center"
            >
              Acceder a la tienda
            </Link>
            <a
              href="https://t.me/decklab_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-snow font-medium text-sm rounded-[8px] transition-all text-center"
            >
              Unirse al grupo →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
