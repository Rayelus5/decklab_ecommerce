"use client";

import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        // refetchOnWindowFocus: cada cambio de pestaña llamaba a /api/auth/session
        // (una invocación de función) sin aportar nada: el JWT no se refresca solo.
        <SessionProvider refetchOnWindowFocus={false}>
            {children}
        </SessionProvider>
    );
}