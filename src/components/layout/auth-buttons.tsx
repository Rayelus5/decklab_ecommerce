"use client"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function SignOutButton() {
    return (
        <button
            onClick={() => signOut()}
            className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition"
            title="Cerrar sesión"
        >
            <LogOut className="w-5 h-5" />
        </button>
    )
}