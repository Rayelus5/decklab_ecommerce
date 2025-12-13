"use client";

import CartItems from "@/components/cart/cart-items";
import CartSummary from "@/components/cart/cart-summary";
import { SessionProvider } from "next-auth/react";

export default function CartPage() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <h1 className="text-3xl font-bold text-white mb-8">Tu Carrito</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Lista de Items (Ocupa 8 columnas en desktop) */}
                <div className="lg:col-span-8">
                    <CartItems />
                </div>

                {/* Resumen (Ocupa 4 columnas) */}
                <div className="lg:col-span-4">
                    <CartSummary />
                </div>
            </div>
        </div>
    );
}