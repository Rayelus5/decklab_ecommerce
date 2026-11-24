"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { ShieldCheck } from "lucide-react"
import { SignOutButton } from "./auth-buttons"

// La sesión se lee en el cliente para que el layout (y con él todas las páginas
// públicas) pueda ser estático en lugar de renderizarse en cada petición.

export function AdminLink() {
    const { data: session } = useSession()
    if (session?.user?.role !== "ADMIN") return null

    return (
        <Link href="/admin" className="text-red-400 hover:text-red-300 transition-colors">
            Panel Admin
        </Link>
    )
}

export function ProBadge() {
    const { data: session } = useSession()
    if (!session?.user?.isPro) return null

    return (
        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-pro/10 border border-pro/20 text-xs font-bold text-pro">
            <ShieldCheck className="w-3 h-3" />
            <span>NIVEL PRO</span>
        </div>
    )
}

export function UserMenu() {
    const { data: session, status } = useSession()
    const user = session?.user

    // Hueco del mismo tamaño mientras llega la sesión: evita el parpadeo de "Entrar"
    if (status === "loading") {
        return <div className="h-9 w-20 rounded-full bg-white/5 animate-pulse" aria-hidden />
    }

    if (user) {
        return (
            <div className="flex items-center gap-4">
                <Link href="/profile" className="hidden sm:block text-sm font-medium text-white hover:underline">
                    {user.name || "Mi Cuenta"}
                </Link>
                <SignOutButton />
            </div>
        )
    }

    return (
        <Link
            href="/login"
            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition"
        >
            Entrar
        </Link>
    )
}
