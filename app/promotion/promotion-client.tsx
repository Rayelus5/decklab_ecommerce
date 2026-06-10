"use client";

import { useState } from "react";
import { redeemPromoCode } from "@/lib/gamification";
import confetti from "canvas-confetti";
import { Ticket, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function PromotionClient({ userId }: { userId?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setMessage({ text: "Debes iniciar sesión para canjear un código.", type: "error" });
      return;
    }
    if (!code.trim()) return;

    setLoading(true);
    setMessage(null);

    const res = await redeemPromoCode(userId, code.trim());

    if (res.success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FBBF24", "#F59E0B", "#D97706"] // Amber colors
      });
      setMessage({ text: "¡Código canjeado con éxito! Redirigiendo a tus cajas...", type: "success" });
      setCode("");
      setTimeout(() => {
        router.push("/profile/inventory");
      }, 1500);
    } else {
      setMessage({ text: res.error || "Código inválido.", type: "error" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-graphite-900 px-4">
      <div className="max-w-md w-full bg-graphite-800/80 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Adorno brillante de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center text-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 rotate-12">
            <Ticket size={32} />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-snow">Canjear Código</h1>
            <p className="text-slate-400 text-sm mt-2">
              Introduce el código de tu ticket promocional para recibir recompensas exclusivas.
            </p>
          </div>

          <form onSubmit={handleRedeem} className="w-full flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej. DECKLAB-EGGS-2026"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-lg text-snow font-mono tracking-widest placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 transition-colors"
            />
            
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-lg py-4 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Canjear Ahora"}
            </button>
          </form>

          {message && (
            <div className={`w-full p-4 rounded-xl text-sm font-medium ${message.type === "success" ? "bg-mint-signal/10 text-mint-signal border border-mint-signal/20" : "bg-ember-red/10 text-ember-red border border-ember-red/20"}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
