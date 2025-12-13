"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Home } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
    const clearCart = useCartStore((state) => state.clearCart);
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (sessionId) {
            clearCart(); // ¡Importante! Vaciar carrito tras compra exitosa
        }
    }, [sessionId, clearCart]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 animate-in zoom-in duration-300">
                <CheckCircle className="w-10 h-10" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¡Pedido Confirmado!
            </h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Gracias por tu compra. Hemos recibido tu pedido correctamente.
                Te enviaremos un email con los detalles en breve.
            </p>

            <div className="flex gap-4">
                <Link
                    href="/products"
                    className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
                >
                    Seguir Comprando
                </Link>
                <Link
                    href="/profile"
                    className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition"
                >
                    Ver Mis Pedidos
                </Link>
            </div>
        </div>
    );
}