import Link from "next/link";
import type { Metadata } from "next";
import { Lock, MessageCircle, UserPlus, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "DECKLAB — Acceso Restringido",
  description: "Esta tienda es exclusiva para miembros del grupo privado de Telegram.",
};

const STEPS = [
  {
    icon: MessageCircle,
    title: "Únete al grupo",
    desc: "Solicita acceso al grupo privado de Telegram de DECKLAB.",
  },
  {
    icon: UserPlus,
    title: "Crea tu cuenta",
    desc: "Regístrate en DECKLAB con tu email.",
  },
  {
    icon: ShieldCheck,
    title: "Verifica con Telegram",
    desc: "Inicia sesión con el botón de Telegram en la página de login.",
  },
];

export default function AccesoPrivadoPage() {
  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,99,99,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md relative z-10 text-center flex flex-col items-center gap-8">
        {/* Icono */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-ember-red/10 border border-ember-red/20 flex items-center justify-center">
            <Lock size={36} className="text-ember-red" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-snow">Acceso Privado</h1>
            <p className="text-slate-300 mt-2 leading-relaxed max-w-sm">
              DECKLAB es una tienda exclusiva para miembros del grupo privado de Telegram.
              Solo los miembros verificados pueden acceder y comprar.
            </p>
          </div>
        </div>

        {/* Pasos */}
        <div className="w-full bg-graphite-700/60 backdrop-blur-sm border border-white/8 rounded-[16px] p-6 text-left flex flex-col gap-4">
          <p className="text-sm font-medium text-slate-200">Cómo obtener acceso</p>
          <ol className="flex flex-col gap-3">
            {STEPS.map((item, i) => {
              const Icon = item.icon;
              return (
                <li key={i} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-[6px] bg-graphite-500 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className="text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-snow">{item.title}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-ash-50 text-graphite-700 hover:bg-white font-medium text-sm px-4 py-3 rounded-[8px] transition-colors"
          >
            Ir al login
          </Link>
          <a
            href="https://t.me/decklab_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-transparent text-snow border border-white/10 hover:border-white/20 hover:bg-white/5 font-medium text-sm px-4 py-3 rounded-[8px] transition-all"
          >
            <MessageCircle size={16} className="text-sky-400" />
            Contactar por Telegram
          </a>
        </div>

        <p className="text-xs text-slate-300/50">
          Si ya eres miembro y no puedes acceder, contacta con un administrador.
        </p>
      </div>
    </div>
  );
}
