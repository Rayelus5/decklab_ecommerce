import Link from "next/link"
import { auth } from "@/lib/auth"
import { ShoppingCart, Menu, User, ShieldCheck } from "lucide-react" // Usando Lucide como pediste
import { SignOutButton } from "./auth-buttons" // Lo creamos ahora
import CartBadge from "@/components/cart/cart-badge";

export default async function Navbar() {
    const session = await auth()
    const user = session?.user

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* LOGO */}
                <Link href="/" className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
                    DECKLAB<span className="text-primary">SHOP</span>
                </Link>

                {/* DESKTOP LINKS */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
                    <Link href="/products" className="hover:text-white transition-colors">
                        Productos
                    </Link>
                    <Link href="/pricing" className="hover:text-white transition-colors">
                        Suscripción PRO
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/admin" className="text-red-400 hover:text-red-300 transition-colors">
                            Panel Admin
                        </Link>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-4">

                    {/* Badge PRO (Solo visible si es PRO) */}
                    {user?.isPro && (
                        <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-pro/10 border border-pro/20 text-xs font-bold text-pro">
                            <ShieldCheck className="w-3 h-3" />
                            <span>NIVEL PRO</span>
                        </div>
                    )}

                    {/* Carrito */}
                    <Link href="/cart" className="relative p-2 text-white hover:bg-white/5 rounded-full transition">
                        <ShoppingCart className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <CartBadge />
                    </Link>

                    {/* User Menu */}
                    {user ? (
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="hidden sm:block text-sm font-medium text-white hover:underline">
                                {user.name || "Mi Cuenta"}
                            </Link>
                            <SignOutButton />
                        </div>
                    ) : (
                        <Link
                            href="/api/auth/signin"
                            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition"
                        >
                            Entrar
                        </Link>
                    )}

                    {/* Mobile Menu Button (Placeholder) */}
                    <button className="md:hidden p-2 text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </nav>
    )
}