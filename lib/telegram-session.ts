import * as crypto from "crypto";

/**
 * Tokens HMAC de un solo uso para el login con Telegram.
 *
 * Vive en su propio módulo (solo depende de `crypto`) para que lib/auth.ts
 * no tenga que importar la route /api/auth/telegram, que arrastra grammY,
 * Prisma y el rate-limiter al bundle del proxy y de cada función que usa auth().
 */

/**
 * Genera un token HMAC de corta duración (2 minutos) vinculado al userId.
 * Lo firmamos con AUTH_SECRET / NEXTAUTH_SECRET para que no sea falsificable.
 * Formato: "<timestamp>:<hmac_hex>"
 */
export function generateSessionToken(userId: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const timestamp = Date.now().toString();
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${timestamp}`)
    .digest("hex");
  return `${timestamp}:${hmac}`;
}

export function verifySessionToken(userId: string, token: string): boolean {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const parts = token.split(":");
  if (parts.length !== 2) return false;
  const [timestampStr, receivedHmac] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Token válido por 2 minutos
  if (Date.now() - timestamp > 2 * 60 * 1000) return false;

  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(`${userId}:${timestampStr}`)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedHmac, "hex"),
    Buffer.from(receivedHmac, "hex")
  );
}
