"use client";

import { useCartStore } from "@/lib/store/cart";
import { useEffect, useState } from "react";

export default function CartBadge() {
    // CAMBIO CLAVE: Escuchamos 'items' directamente. 
    // Esto obliga a React a renderizar cada vez que el array cambia.
    const items = useCartStore((state) => state.items);

    const [mounted, setMounted] = useState(false);

    // Calculamos el total aquí mismo
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Si no está montado o está vacío, no mostrar nada
    if (!mounted || totalItems === 0) return null;

    return (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-neon-violet text-ghost-white text-[10px] font-extrabold flex items-center justify-center rounded-full animate-in zoom-in border border-midnight-abyss">
            {totalItems > 99 ? "+99" : totalItems}
        </span>
    );
}