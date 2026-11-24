'use client';

import { useEffect } from 'react';
// ldrs define custom elements (extends HTMLElement): importarlo arriba rompe el SSR/prerender.
// Se carga solo en el navegador y se registra al montar.
const registerRing2 = () => import('ldrs').then(({ ring2 }) => ring2.register());

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
        // Registramos el componente web al montar (solo cliente)
        registerRing2();
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
        registerRing2();
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