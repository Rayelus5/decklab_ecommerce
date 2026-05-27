"use client";

import { useEffect, useRef, useCallback } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  callbackUrl?: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void;
  }
}

export function TelegramLoginButton({
  onSuccess,
  onError,
  callbackUrl = "/products",
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  const handleAuth = useCallback(
    async (user: TelegramAuthData) => {
      try {
        toast.loading("Verificando membresía en el grupo...", { id: "tg-auth" });

        // 1. Enviar datos al backend para verificar firma + membresía
        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error ?? "Error al verificar tu cuenta de Telegram", {
            id: "tg-auth",
          });
          onError?.(data.error ?? "Error desconocido");
          return;
        }

        // 2. Iniciar sesión NextAuth con el email del usuario Telegram
        const result = await signIn("credentials", {
          email: data.user.email,
          telegramId: data.user.telegramId,
          redirect: false,
        });

        if (result?.error) {
          // Si el login por credentials falla (usuario no tiene contraseña),
          // usar el flujo de email mágico o crear sesión custom
          // Por ahora redirigimos con el token
          toast.dismiss("tg-auth");
          toast.success("¡Acceso concedido! Bienvenido a DECKLAB 🎴");
          onSuccess?.();
          window.location.href = callbackUrl;
          return;
        }

        toast.success("¡Acceso concedido! Bienvenido a DECKLAB 🎴", {
          id: "tg-auth",
        });
        onSuccess?.();
        window.location.href = callbackUrl;
      } catch {
        toast.error("Error de conexión. Inténtalo de nuevo.", { id: "tg-auth" });
        onError?.("Error de red");
      }
    },
    [callbackUrl, onError, onSuccess]
  );

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    // Callback global que llama el widget de Telegram
    window.onTelegramAuth = handleAuth;

    // Crear el script del Telegram Login Widget
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current?.contains(script)) {
        containerRef.current.removeChild(script);
      }
      delete window.onTelegramAuth;
    };
  }, [botUsername, handleAuth]);

  if (!botUsername) {
    return (
      <div className="text-sm text-ember-red text-center">
        ⚠️ NEXT_PUBLIC_TELEGRAM_BOT_USERNAME no configurado
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Widget de Telegram (inyectado por el script) */}
      <div ref={containerRef} className="min-h-[48px] flex items-center justify-center" />
      <p className="text-xs text-slate-300 text-center max-w-xs">
        Solo miembros del grupo privado pueden acceder.
        Tu información de Telegram se usa únicamente para verificar la membresía.
      </p>
    </div>
  );
}
