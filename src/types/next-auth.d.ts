import NextAuth, { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            isPro: boolean
            proTierId?: string | null
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        isPro: boolean
        proTierId?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        isPro: boolean
        proTierId?: string | null
    }
}