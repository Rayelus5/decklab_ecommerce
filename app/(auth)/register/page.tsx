import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Logo + título */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[11px] bg-graphite-600 border border-white/10 mb-4">
          <span className="text-2xl" role="img" aria-label="DECKLAB">🎴</span>
        </div>
        <h1 className="text-xl font-semibold text-snow">Crear cuenta</h1>
        <p className="text-sm text-slate-300 mt-1">
          Únete a DECKLAB · Acceso privado
        </p>
      </div>

      {/* Info de acceso */}
      <div className="bg-ember-red/10 border border-ember-red/20 rounded-[11px] px-4 py-3">
        <p className="text-xs text-ember-red font-medium">
          ⚠️ Acceso restringido
        </p>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          La tienda es exclusiva para miembros del grupo privado de Telegram.
          Aunque crees una cuenta, necesitarás verificar tu membresía para acceder.
        </p>
      </div>

      {/* Card con formulario */}
      <div className="bg-graphite-700/60 backdrop-blur-sm border border-white/8 rounded-[16px] p-6">
        <RegisterForm />
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-slate-300">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="text-ash-50 hover:text-snow underline underline-offset-2 transition-colors"
        >
          Inicia sesión
        </Link>
      </p>

      {/* Aviso no devoluciones */}
      <p className="text-center text-xs text-slate-300/60 leading-relaxed">
        Al registrarte aceptas que{" "}
        <span className="text-slate-300">no se realizan devoluciones</span>{" "}
        en ninguna de las compras realizadas en DECKLAB.
      </p>
    </div>
  );
}
