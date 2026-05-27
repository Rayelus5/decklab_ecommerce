"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
    const clearCart = useCartStore((state) => state.clearCart);
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (sessionId) {
            clearCart();
        }
    }, [sessionId, clearCart]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-20 h-20 bg-[#4ade80]/10 rounded-full flex items-center justify-center mb-6 text-[#4ade80] animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10" />
            </div>

            <h1 className="text-display font-aeonikpro font-medium text-ghost-white mb-4">
                ¡Pedido Confirmado!
            </h1>
            <p className="text-body text-whisper-blue max-w-md mb-8">
                Gracias por tu compra. Hemos recibido tu pedido correctamente.
                Te enviaremos un email con los detalles en breve.
            </p>

            <div className="flex gap-4">
                <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-6 py-2.5 text-body text-arctic-mist border border-[rgba(186,215,247,0.12)] rounded-pill hover:bg-white/5 transition-colors"
                >
                    Seguir Comprando
                </Link>
                <Link
                    href="/profile"
                    className="inline-flex items-center justify-center px-6 py-2.5 text-body font-medium bg-neon-violet text-ghost-white rounded-md hover:bg-neon-violet/90 transition-colors"
                >
                    Ver Mis Pedidos
                </Link>
            </div>
        </div>
    );
}
