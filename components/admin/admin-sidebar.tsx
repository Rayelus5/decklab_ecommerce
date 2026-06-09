"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { clsx } from "clsx";
import {
  Layers,
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Users,
  Crown,
  Truck,
  Ticket,
  ScrollText,
  LogOut,
  ChevronRight,
  ShoppingCart,
  Clock,
  Mail,
  Star,
  Gift,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/products", icon: Package, label: "Productos" },
  { href: "/admin/categories", icon: Tag, label: "Categorías" },
  { href: "/admin/orders", icon: ShoppingBag, label: "Pedidos" },
  { href: "/admin/abandoned-carts", icon: ShoppingCart, label: "Carritos" },
  { href: "/admin/emails", icon: Mail, label: "Emails" },
  { href: "/admin/users", icon: Users, label: "Usuarios" },
  { href: "/admin/pro-tiers", icon: Crown, label: "PRO Tiers" },
  { href: "/admin/shipping", icon: Truck, label: "Envíos" },
  { href: "/admin/reservations", icon: Clock, label: "Reservas" },
  { href: "/admin/coupons", icon: Ticket, label: "Cupones" },
  { href: "/admin/vip-tiers", icon: Star, label: "Niveles VIP" },
  { href: "/admin/promocodes", icon: Gift, label: "Cód. Promocionales" },
  { href: "/admin/logs", icon: ScrollText, label: "Actividad" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-white/8 bg-graphite-800/80 min-h-screen sticky top-0">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-5 border-b border-white/8">
        <div className="w-6 h-6 rounded-[6px] bg-ash-50 flex items-center justify-center">
          <Layers size={12} className="text-graphite-700" />
        </div>
        <span className="text-sm font-bold text-snow tracking-tight">DECKLAB</span>
        <span className="text-xs text-slate-300/60 ml-auto">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm transition-colors",
                active
                  ? "bg-white/8 text-snow font-medium"
                  : "text-slate-300 hover:text-snow hover:bg-white/5"
              )}
            >
              <Icon size={15} className={active ? "text-snow" : "text-slate-300"} />
              {label}
              {active && (
                <ChevronRight size={12} className="ml-auto text-slate-300/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-[8px] text-sm text-slate-300 hover:text-snow hover:bg-white/5 transition-colors"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
