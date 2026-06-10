import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Crown, ChevronRight } from "lucide-react";
import { CreateUserDialog } from "./create-user-dialog";

export const metadata: Metadata = { title: "Usuarios — DECKLAB Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = parseInt(sp.page ?? "1");
  const PAGE_SIZE = 20;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { telegramUsername: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPro: true,
        isTelegramMember: true,
        telegramUsername: true,
        proTier: { select: { name: true } },
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-snow">Usuarios</h1>
          <p className="text-slate-300 text-sm mt-1">{total} usuario{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}</p>
        </div>
        <CreateUserDialog />
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por email, nombre o Telegram..."
          className="w-full max-w-sm px-4 py-2 bg-graphite-700/60 border border-white/8 rounded-[8px] text-sm text-snow placeholder-slate-300/40 focus:outline-none focus:border-white/20"
        />
      </form>

      {/* Table */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Telegram</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Pedidos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Registro</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-300/60">Sin usuarios</td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-snow font-medium text-xs">{user.name ?? "Sin nombre"}</p>
                    <p className="text-slate-300/60 text-xs">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {user.telegramUsername ? (
                      <span className={`text-xs ${user.isTelegramMember ? "text-mint-signal" : "text-slate-300"}`}>
                        @{user.telegramUsername}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300/40">No vinculado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.isPro ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                        <Crown size={11} /> {user.proTier?.name ?? "PRO"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300/50">Gratuito</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${user.role === "ADMIN" ? "text-amber-400" : "text-slate-300"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs tabular-nums">{user._count.orders}</td>
                  <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="cursor-pointer p-1.5 rounded-[6px] text-slate-300 hover:text-snow hover:bg-white/8 transition-colors flex items-center"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-xs text-slate-300">{total} usuarios</span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link href={`/admin/users?${q ? `q=${q}&` : ""}page=${page - 1}`} className="cursor-pointer px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px]">Anterior</Link>
              )}
              <span className="text-xs text-slate-300">{page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/admin/users?${q ? `q=${q}&` : ""}page=${page + 1}`} className="cursor-pointer px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px]">Siguiente</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
