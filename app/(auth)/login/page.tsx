import Link from "next/link";
import { Suspense } from "react";
import { Layers } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";
import { AuthErrorBoundary } from "@/components/error-boundary";

function GoogleLoginButton() {
  return (
    <form action="/api/auth/signin/google" method="POST">
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-snow text-sm font-medium px-4 py-2.5 rounded-[8px] transition-all duration-200 cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
          <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
        </svg>
        Continuar con Google
      </button>
    </form>
  );
}

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
          className="text-ash-50 hover:text-snow underline underline-offset-2 transition-colors"
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
