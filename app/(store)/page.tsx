import Link from "next/link";
import type { Metadata } from "next";
import {
  Shuffle,
  PackageCheck,
  Users,
  Zap,
  Truck,
  Lock,
  BarChart2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { Waves } from "@/components/ui/wave-background";

export const metadata: Metadata = {
  title: "DECKLAB — Pokémon TCG Premium",
  description:
    "La tienda privada de Pokémon TCG personalizado. Acceso exclusivo para miembros de nuestra comunidad en Telegram.",
};

const FEATURES = [
  {
    Icon: Shuffle,
    title: "Aleatoriedad verificada",
    desc: "Todas las probabilidades están publicadas. Randomización justa y sin manipulación.",
  },
  {
    Icon: PackageCheck,
    title: "Envío seguro",
    desc: "Embalaje profesional. Correos Certificado disponible para mayor seguridad.",
  },
  {
    Icon: Users,
    title: "Comunidad privada",
    desc: "Solo miembros del grupo de Telegram. Una comunidad real de coleccionistas.",
  },
];

const PRO_BENEFITS = [
  {
    Icon: BarChart2,
    title: "Allowance mensual",
    desc: "Crédito mensual para comprar al precio PRO exclusivo de cada nivel.",
  },
  {
    Icon: Zap,
    title: "Acceso anticipado",
    desc: "Disfruta de early access a nuevos productos horas antes que el resto.",
  },
  {
    Icon: Truck,
    title: "Envío gratuito",
    desc: "Envío sin coste en tiers superiores. Sin sorpresas en el checkout.",
  },
  {
    Icon: Lock,
    title: "Productos exclusivos",
    desc: "Acceso a colecciones y ediciones limitadas solo para miembros PRO.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ============ HERO ============ */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ShaderAnimation />
        </div>
        <div className="absolute inset-0 bg-void-black/60" aria-hidden="true" />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center gap-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/12 rounded-full text-xs text-slate-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-signal animate-pulse" aria-hidden="true" />
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
            <Lock size={11} className="text-slate-300/60" />
            Acceso exclusivo para miembros del grupo privado de Telegram
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
          <div className="w-5 h-8 border-2 border-white/20 rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ============ CARACTERÍSTICAS ============ */}
      <section className="py-20 px-4">
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
            {FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="bg-graphite-700/40 border border-white/8 rounded-[16px] p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-[10px] bg-graphite-600 border border-white/10 flex items-center justify-center">
                  <Icon size={18} className="text-ash-50" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-snow">{title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ BENEFICIOS PRO ============ */}
      <section className="py-20 px-4 relative overflow-hidden bg-graphite-700/20">
        <div className="absolute inset-0 opacity-25" aria-hidden="true">
          <Waves />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400 mb-4">
              <Lock size={11} />
              Suscripción PRO
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-snow">
              Lleva tu colección al siguiente nivel
            </h2>
            <p className="text-slate-300 mt-2 max-w-md mx-auto">
              5 niveles de suscripción con allowance mensual y perks exclusivos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {PRO_BENEFITS.map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 items-start bg-graphite-600/40 border border-white/8 rounded-[11px] p-4"
              >
                <div className="w-9 h-9 rounded-[8px] bg-graphite-500 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-snow">{title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{desc}</p>
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
              <ArrowRight size={15} />
            </Link>
            <p className="text-xs text-slate-300/60 mt-3">
              Permanencia mínima de 2 meses · Facturación bimestral
            </p>
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-[14px] bg-graphite-600 border border-white/10 flex items-center justify-center">
            <Layers size={24} className="text-ash-50" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-snow">Listo para unirte?</h2>
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
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-snow font-medium text-sm rounded-[8px] transition-all text-center flex items-center justify-center gap-2"
            >
              Unirse al grupo
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
