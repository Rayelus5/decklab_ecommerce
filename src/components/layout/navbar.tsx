import Link from "next/link"
import { auth } from "@/lib/auth"
import { ShoppingCart, Menu, User, ShieldCheck } from "lucide-react"
import { SignOutButton } from "./auth-buttons"
import CartBadge from "@/components/cart/cart-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function Navbar() {
    const session = await auth()
    const user = session?.user

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-midnight-abyss/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                {/* LOGO */}
                <Link href="/" className="text-heading-lg font-aeonikpro font-medium tracking-tight text-ghost-white flex items-center gap-2">
                    DECKLAB<span className="text-neon-violet">SHOP</span>
                </Link>

                {/* DESKTOP LINKS */}
                <div className="hidden md:flex items-center gap-8 text-body font-medium text-arctic-mist">
                    <Link href="/products" className="hover:text-ghost-white transition-colors">
                        Productos
                    </Link>
                    <Link href="/pricing" className="hover:text-ghost-white transition-colors">
                        Suscripción PRO
                    </Link>
                    {user?.role === "ADMIN" && (
                        <Link href="/admin" className="text-neon-violet font-bold hover:text-celestial-light transition-colors flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Panel Admin
                        </Link>
                    )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-4">
                    {/* Badge PRO (Solo visible si es PRO) */}
                    {user?.isPro && (
                        <Badge variant="status" className="hidden sm:flex gap-1.5 px-3 py-1 bg-neon-violet/10 text-neon-violet border border-neon-violet/20 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>PRO</span>
                        </Badge>
                    )}

                    {/* Carrito */}
                    <Link href="/cart" className="relative bg-[rgba(199,211,234,0.06)] text-ghost-white border border-[rgba(186,215,247,0.15)] hover:bg-[rgba(186,214,247,0.1)] hover:border-[rgba(186,215,247,0.28)] rounded-pill h-10 w-10 flex items-center justify-center transition-all duration-200">
                        <ShoppingCart className="w-5 h-5" />
                        <CartBadge />
                    </Link>

                    {/* User Menu */}
                    {user ? (
                        <div className="flex items-center gap-4 ml-2">
                            <Link href="/profile" className="hidden sm:block text-body font-medium text-ghost-white hover:text-celestial-light transition-colors">
                                {user.name || "Mi Cuenta"}
                            </Link>
                            <SignOutButton />
                        </div>
                    ) : (
                        <Link href="/api/auth/signin" className="ml-2">
                            <Button variant="primary-pill" size="default" className="h-10 px-6">
                                Entrar
                            </Button>
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <Button variant="icon" className="md:hidden">
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </nav>
    )
}