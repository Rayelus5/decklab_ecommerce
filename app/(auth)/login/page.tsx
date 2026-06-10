import Link from "next/link";
import { Suspense } from "react";
import { Layers } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { AuthErrorBoundary } from "@/components/error-boundary";

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-xs text-slate-300 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Logo + título */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[11px] bg-graphite-600 border border-white/10 mb-4">
          <Layers size={22} className="text-ash-50" />
        </div>
        <h1 className="text-xl font-semibold text-snow">Accede a DECKLAB</h1>
        <p className="text-sm text-slate-300 mt-1">
          Tienda privada · Solo miembros del grupo
        </p>
      </div>

      {/* Card principal */}
      <AuthErrorBoundary>
      <div className="bg-graphite-700/60 backdrop-blur-sm border border-white/8 rounded-[16px] p-6 flex flex-col gap-5">
        {/* Telegram */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-slate-200 uppercase tracking-widest">
            Acceso con Telegram
          </p>
          <Suspense fallback={
            <div className="h-12 bg-white/5 rounded-[8px] animate-pulse" />
          }>
            <TelegramLoginButton callbackUrl="/products" />
          </Suspense>
        </div>

        <Divider label="o con tu cuenta" />

        <GoogleLoginButton />

        <Divider label="o con email" />

        <LoginForm callbackUrl="/products" />
      </div>
      </AuthErrorBoundary>

      <p className="text-center text-sm text-slate-300">
        No tienes cuenta?{" "}
        <Link
          href="/register"
          className="cursor-pointer text-ash-50 hover:text-snow underline underline-offset-2 transition-colors"
        >
          Regístrate
        </Link>
      </p>

      <p className="text-center text-xs text-slate-300/60 leading-relaxed">
        Al continuar, aceptas los{" "}
        <span className="text-slate-300">términos de uso</span> y la{" "}
        <span className="text-slate-300">política de privacidad</span> de DECKLAB.
      </p>
    </div>
  );
}
