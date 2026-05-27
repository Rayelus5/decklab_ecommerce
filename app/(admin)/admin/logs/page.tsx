import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Actividad — DECKLAB Admin" };

const ACTION_COLORS: Record<string, string> = {
  PRODUCT_CREATED: "text-mint-signal bg-mint-signal/10",
  PRODUCT_UPDATED: "text-sky-400 bg-sky-400/10",
  PRODUCT_DELETED: "text-ember-red bg-ember-red/10",
  ORDER_STATUS_CHANGED: "text-amber-400 bg-amber-400/10",
  USER_UPDATED: "text-blue-400 bg-blue-400/10",
  USER_BLOCKED: "text-ember-red bg-ember-red/10",
  PRO_TIER_CREATED: "text-mint-signal bg-mint-signal/10",
  PRO_TIER_UPDATED: "text-sky-400 bg-sky-400/10",
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1");
  const typeFilter = sp.type;
  const PAGE_SIZE = 25;

  const where = typeFilter ? { actionType: typeFilter } : {};

  const [logs, total] = await Promise.all([
    prisma.adminActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        admin: { select: { name: true, email: true } },
      },
    }),
    prisma.adminActionLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Get unique action types for filter
  const actionTypes = await prisma.adminActionLog.groupBy({
    by: ["actionType"],
    orderBy: { actionType: "asc" },
  });

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-snow">Registro de actividad</h1>
        <p className="text-slate-300 text-sm mt-1">{total} entrada{total !== 1 ? "s" : ""} registrada{total !== 1 ? "s" : ""}</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <a
          href="/admin/logs"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!typeFilter ? "bg-ash-50 text-graphite-700" : "bg-graphite-700/60 border border-white/8 text-slate-300 hover:text-snow"}`}
        >
          Todos
        </a>
        {actionTypes.map(({ actionType }) => (
          <a
            key={actionType}
            href={`/admin/logs?type=${actionType}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === actionType ? "bg-ash-50 text-graphite-700" : "bg-graphite-700/60 border border-white/8 text-slate-300 hover:text-snow"}`}
          >
            {actionType}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-graphite-700/40 border border-white/8 rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Objetivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Detalles</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-300">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-300/60">Sin registros</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.actionType] ?? "text-slate-300 bg-white/8"}`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-snow text-xs">{log.admin.name ?? log.admin.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {log.targetType && <span className="text-slate-300/60">{log.targetType}</span>}
                    {log.targetId && <span className="font-mono ml-1 text-snow truncate max-w-24 block">{log.targetId.slice(0, 8)}…</span>}
                  </td>
                  <td className="px-4 py-3">
                    {log.details && (
                      <code className="text-xs text-slate-300/60 max-w-48 truncate block">
                        {JSON.stringify(log.details).slice(0, 60)}
                      </code>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
            <span className="text-xs text-slate-300">{total} registros</span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <a href={`/admin/logs?${typeFilter ? `type=${typeFilter}&` : ""}page=${page - 1}`} className="px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px]">Anterior</a>
              )}
              <span className="text-xs text-slate-300">{page} / {totalPages}</span>
              {page < totalPages && (
                <a href={`/admin/logs?${typeFilter ? `type=${typeFilter}&` : ""}page=${page + 1}`} className="px-3 py-1.5 text-xs text-slate-300 hover:text-snow bg-graphite-600/60 rounded-[6px]">Siguiente</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
