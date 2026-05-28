"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Crown, RefreshCcw } from "lucide-react";

const MAX_ATTEMPTS = 12; // 12 × 2s = 24 segundos máximo
const POLL_INTERVAL = 2000;

export function SubscriptionSuccess() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscribed = searchParams.get("subscribed") === "1";

  const [attempts, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const isPolling = useRef(false);

  useEffect(() => {
    if (!subscribed) return;

    // Ya tiene PRO — redirigir inmediatamente
    if (session?.user?.isPro) {
      toast.success("¡Bienvenido a PRO! Tu cuenta ya está activa.");
      router.replace("/profile");
      return;
    }

    // Tiempo agotado
    if (attempts >= MAX_ATTEMPTS) {
      setTimedOut(true);
      return;
    }

    // Evitar disparar múltiples polls simultáneos
    if (isPolling.current) return;

    isPolling.current = true;
    const timer = setTimeout(async () => {
      await update(); // trigger === "update" → refreshFromDb() en el jwt callback
      setAttempts((a) => a + 1);
      isPolling.current = false;
    }, POLL_INTERVAL);

    return () => {
      clearTimeout(timer);
      isPolling.current = false;
    };
  }, [subscribed, session?.user?.isPro, attempts, update, router]);

  if (!subscribed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/80 backdrop-blur-sm">
      <div className="bg-graphite-700 border border-amber-500/25 rounded-[20px] p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-5 shadow-2xl">
        {timedOut ? (
          <>
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Crown size={24} className="text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-snow font-semibold text-base">Pago procesado</p>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Tu suscripción PRO está siendo activada. Recarga la página en unos segundos para ver tu nuevo plan.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-graphite-700 font-semibold text-sm rounded-[10px] transition-colors cursor-pointer"
            >
              <RefreshCcw size={14} />
              Recargar página
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Loader2 size={24} className="text-amber-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-snow font-semibold text-base">Activando tu membresía PRO</p>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Estamos confirmando tu pago con Stripe. Esto solo tardará unos segundos…
              </p>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i < (attempts % 5) + 1 ? "bg-amber-400" : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
