import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data
                    const user = await prisma.user.findUnique({ where: { email } })
                    if (!user || !user.password) return null

                    const passwordsMatch = await bcrypt.compare(password, user.password)
                    if (passwordsMatch) return user
                }
                return null
            },
        }),
    ],
    callbacks: {
        // Extendemos el token JWT con datos críticos
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.isPro = user.isPro
                token.proTierId = user.proTierId
            }
            return token
        },
        // Pasamos esos datos a la sesión del cliente
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
                session.user.role = token.role as "ADMIN" | "CUSTOMER"
                session.user.isPro = token.isPro as boolean
                session.user.proTierId = token.proTierId as string | null
            }
            return session
        }
    },
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login", // Crearemos esta página luego
    }
})