/**
 * lib/safe-query.ts — Wrapper para consultas Prisma en server components.
 *
 * Cuando la base de datos no está disponible (env local sin DB, cold start, etc.)
 * devuelve el fallback en lugar de lanzar un 500 al usuario.
 */

export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  label = "query"
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // Solo loguear en server — no exponer detalles al cliente
    console.error(`[DB] ${label} failed:`, (err as Error).message);
    return fallback;
  }
}
