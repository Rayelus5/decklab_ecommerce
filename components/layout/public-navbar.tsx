"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  isPro?: boolean;
  role?: string;
};

/**
 * Navbar para las páginas públicas (landing y /legal).
 *
 * Lee la sesión en el cliente en vez de llamar a auth() en el layout: así esas
 * páginas se sirven estáticas desde la CDN (cero CPU para bots y visitas
 * anónimas) y solo los navegadores reales hacen una petición ligera a
 * /api/auth/session.
 */
export function PublicNavbar() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((session: { user?: SessionUser } | null) => {
        if (!cancelled) setUser(session?.user ?? null);
      })
      .catch(() => {
        /* sin sesión: navbar anónima */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Navbar
      userName={user?.name ?? user?.email ?? undefined}
      isPro={user?.isPro ?? false}
      isAdmin={user?.role === "ADMIN"}
    />
  );
}
