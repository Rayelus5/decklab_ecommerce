/**
 * lib/rate-limit.ts — Rate limiting en memoria para rutas API.
 *
 * Contador simple por IP + ventana de tiempo. No persistente entre
 * instancias (suficiente para Vercel con un worker por request).
 * Para producción a escala usar Upstash Redis o similar.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas periódicamente
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Comprueba si una clave (IP + route) supera el límite.
 *
 * @param key    Clave única (ej. `auth:${ip}`, `checkout:${userId}`)
 * @param limit  Máx. peticiones en la ventana
 * @param windowMs Tamaño de la ventana en ms (default 60s)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Nueva ventana
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extrae la IP real del request considerando proxies (Vercel).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
