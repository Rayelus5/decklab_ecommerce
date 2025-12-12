'use client';

import { useEffect } from 'react';
// Importamos dinámicamente o registramos el componente web
import { ring2 } from 'ldrs';

export default function Loader({
    size = 40,
    color = 'white', // Por defecto blanco para fondo oscuro
    className
}: {
    size?: number;
    color?: string;
    className?: string;
}) {

    useEffect(() => {
        // Registramos el componente web al montar
        ring2.register();
    }, []);

    return (
        <div className={`flex items-center justify-center ${className}`}>
            {/* @ts-ignore - TypeScript no reconoce custom elements nativos sin configuración extra */}
            <l-ring-2
                size={size}
                stroke="5"
                stroke-length="0.25"
                bg-opacity="0.1"
                speed="0.8"
                color={color}
            ></l-ring-2>
        </div>
    );
}

// Versión a pantalla completa para cargas iniciales
export function FullPageLoader() {
    useEffect(() => {
        ring2.register();
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            {/* @ts-ignore */}
            <l-ring-2
                size="60"
                stroke="5"
                stroke-length="0.25"
                bg-opacity="0.1"
                speed="0.8"
                color="white"
            ></l-ring-2>
        </div>
    );
}