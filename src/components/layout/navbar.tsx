import Link from "next/link"
import { ShoppingCart, Menu } from "lucide-react"
import CartBadge from "@/components/cart/cart-badge";
import { AdminLink, ProBadge, UserMenu } from "./navbar-user"

// Server Component sin acceso a la sesión: así no fuerza el renderizado
// dinámico de todo el sitio. Las partes que dependen del usuario son de cliente.
export default function Navbar() {
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
                    <AdminLink />
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-4">

                    {/* Badge PRO (Solo visible si es PRO) */}
                    <ProBadge />

                    {/* Carrito */}
                    <Link href="/cart" className="relative p-2 text-white hover:bg-white/5 rounded-full transition">
                        <ShoppingCart className="w-5 h-5 group-hover:text-primary transition-colors" />
                        <CartBadge />
                    </Link>

                    {/* User Menu */}
                    <UserMenu />

                    {/* Mobile Menu Button (Placeholder) */}
                    <button className="md:hidden p-2 text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </nav>
    )
}
