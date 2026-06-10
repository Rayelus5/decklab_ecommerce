"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Package,
  Crown,
  Menu,
  X,
  Layers,
} from "lucide-react";
import { clsx } from "clsx";
import { useCart } from "@/lib/hooks/use-cart";

interface NavbarProps {
  userName?: string | null;
  isPro?: boolean;
  isAdmin?: boolean;
}

const NAV_LINKS = [
  { href: "/products", label: "Productos" },
  { href: "/pricing", label: "Házte PRO" },
  { href: "/cart", label: "Carrito" },
];

export function Navbar({ userName, isPro, isAdmin }: NavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const itemCount = useCart((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  function handleSignOut() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="sticky top-0 z-50 bg-deep-charcoal/90 backdrop-blur-md border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="cursor-pointer flex items-center gap-2 font-semibold text-snow hover:text-ash-50 transition-colors shrink-0"
        >
          <div className="w-7 h-7 bg-graphite-500 border border-white/15 rounded-[6px] flex items-center justify-center">
            <Layers size={14} className="text-ash-50" />
          </div>
          <span className="text-sm tracking-wide">DECKLAB</span>
          {isPro && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-amber-500/15 border border-amber-500/25 text-amber-400">
              PRO
            </span>
          )}
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden sm:flex items-center gap-1" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx("cursor-pointer", 
                "px-3 py-1.5 text-sm rounded-[8px] transition-colors",
                pathname.startsWith(link.href)
                  ? "text-snow bg-white/8"
                  : "text-slate-300 hover:text-snow hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={clsx("cursor-pointer", 
                "px-3 py-1.5 text-sm rounded-[8px] transition-colors",
                pathname.startsWith("/admin")
                  ? "text-ember-red bg-ember-red/10"
                  : "text-slate-300 hover:text-ember-red hover:bg-ember-red/10"
              )}
            >
              ADMIN
            </Link>
          )}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Carrito */}
          <Link
            href="/cart"
            className="cursor-pointer relative p-2 text-slate-300 hover:text-snow hover:bg-white/5 rounded-[8px] transition-colors"
            aria-label={`Carrito${itemCount > 0 ? `, ${itemCount} items` : ""}`}
          >
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-ember-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {/* Menú de usuario */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 p-2 text-slate-300 hover:text-snow hover:bg-white/5 rounded-[8px] transition-colors"
              aria-label="Menú de usuario"
              aria-expanded={userMenuOpen}
            >
              <User size={18} />
              {userName && (
                <span className="hidden sm:block text-sm truncate max-w-[100px]">
                  {userName.split(" ")[0]}
                </span>
              )}
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-graphite-600 border border-white/10 rounded-[11px] shadow-2xl py-1 z-20 overflow-hidden">
                  {userName && (
                    <div className="px-3 py-2 border-b border-white/8">
                      <p className="text-xs text-slate-300 truncate">{userName}</p>
                    </div>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:text-snow hover:bg-white/5 transition-colors"
                  >
                    <User size={14} />
                    Mi perfil
                  </Link>
                  <Link
                    href="/profile/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:text-snow hover:bg-white/5 transition-colors"
                  >
                    <Package size={14} />
                    Mis pedidos
                  </Link>
                  {!isPro && (
                    <Link
                      href="/pricing"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                    >
                      <Crown size={14} />
                      Hazte PRO
                    </Link>
                  )}
                  <Link
                    href="/profile/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:text-snow hover:bg-white/5 transition-colors"
                  >
                    <Settings size={14} />
                    Configuración
                  </Link>
                  <div className="border-t border-white/8 mt-1 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:text-ember-red hover:bg-ember-red/10 transition-colors text-left"
                    >
                      <LogOut size={14} />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="cursor-pointer sm:hidden p-2 text-slate-300 hover:text-snow hover:bg-white/5 rounded-[8px] transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/8 bg-deep-charcoal/95 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={clsx(
                "px-3 py-2 text-sm rounded-[8px] transition-colors",
                pathname.startsWith(link.href)
                  ? "text-snow bg-white/8"
                  : "text-slate-300 hover:text-snow hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 text-sm text-ember-red hover:bg-ember-red/10 rounded-[8px] transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
