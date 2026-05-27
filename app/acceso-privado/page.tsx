import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DECKLAB — Acceso Restringido",
  description: "Esta tienda es exclusiva para miembros del grupo privado de Telegram.",
};

export default function AccesoPrivadoPage() {
  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo */}
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
            <span className="text-4xl" role="img" aria-label="Acceso restringido">🔒</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-snow">Acceso Privado</h1>
            <p className="text-slate-300 mt-2 leading-relaxed max-w-sm">
              DECKLAB es una tienda exclusiva para miembros del grupo privado de Telegram.
              Solo los miembros verificados pueden acceder y comprar.
            </p>
          </div>
        </div>

        {/* Card de pasos */}
        <div className="w-full bg-graphite-700/60 backdrop-blur-sm border border-white/8 rounded-[16px] p-6 text-left flex flex-col gap-4">
          <p className="text-sm font-medium text-slate-200">¿Cómo obtener acceso?</p>
          <ol className="flex flex-col gap-3">
            {[
              {
                step: "1",
                title: "Únete al grupo",
                desc: "Solicita acceso al grupo privado de Telegram de DECKLAB.",
              },
              {
                step: "2",
                title: "Crea tu cuenta",
                desc: "Regístrate en DECKLAB con tu email.",
              },
              {
                step: "3",
                title: "Verifica con Telegram",
                desc: 'Inicia sesión con el botón de Telegram en la página de login.',
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-ember-red/20 border border-ember-red/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-ember-red">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-snow">{item.title}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/login"
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-[#29B6F6]"
              aria-hidden="true"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
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
