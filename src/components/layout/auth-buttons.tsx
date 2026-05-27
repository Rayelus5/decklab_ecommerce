"use client"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
    return (
        <Button
            variant="icon"
            onClick={() => signOut()}
            title="Cerrar sesión"
        >
            <LogOut className="w-5 h-5" />
        </Button>
    )
}