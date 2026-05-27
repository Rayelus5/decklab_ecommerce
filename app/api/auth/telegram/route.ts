import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { verifyTelegramWidgetData, checkGroupMembership } from "@/lib/telegram";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { TelegramAuthData } from "@/lib/telegram";

/**
 * Genera un token HMAC de corta duración (2 minutos) vinculado al userId.
 * Lo firmamos con AUTH_SECRET / NEXTAUTH_SECRET para que no sea falsificable.
 * Formato: "<timestamp>:<hmac_hex>"
 */
function generateSessionToken(userId: string): string {
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

/**
 * POST /api/auth/telegram
 *
 * Endpoint que recibe los datos del Telegram Login Widget,
 * verifica la firma criptográfica, comprueba la membresía
 * en el grupo privado y crea/actualiza el usuario.
 *
 * El cliente redirige a este endpoint con los datos del widget
 * via callback o AJAX.
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 intentos por IP por minuto
  const ip = getClientIp(request);
  const rl = rateLimit(`telegram-auth:${ip}`, 10, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const telegramData = body as TelegramAuthData;

    // 1. Verificar firma del widget (HMAC-SHA256)
    const isValid = verifyTelegramWidgetData(telegramData);
    if (!isValid) {
      return NextResponse.json(
        { error: "Datos de Telegram inválidos o expirados" },
        { status: 401 }
      );
    }

    // 2. Verificar que el usuario pertenece al grupo privado
    const isMember = await checkGroupMembership(telegramData.id);
    if (!isMember) {
      return NextResponse.json(
        {
          error: "No eres miembro del grupo privado de DECKLAB en Telegram.",
          code: "NOT_MEMBER",
        },
        { status: 403 }
      );
    }

    // 3. Crear o actualizar el usuario en la BD
    const telegramId = String(telegramData.id);
    const telegramUsername = telegramData.username;
    const fullName = [telegramData.first_name, telegramData.last_name]
      .filter(Boolean)
      .join(" ");

    // Intentar encontrar usuario por telegramId primero
    let user = await prisma.user.findFirst({
      where: { telegramId },
    });

    if (!user) {
      // Crear nuevo usuario con Telegram como método de login
      // Usamos un email ficticio basado en el ID (se puede cambiar después)
      const fakeEmail = `telegram_${telegramId}@decklab.internal`;

      user = await prisma.user.create({
        data: {
          email: fakeEmail,
          name: fullName || telegramUsername || `Usuario ${telegramId}`,
          telegramId,
          telegramUsername: telegramUsername ?? null,
          isTelegramMember: true,
          telegramVerifiedAt: new Date(),
          role: "CUSTOMER",
        },
      });
    } else {
      // Actualizar datos de Telegram del usuario existente
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: telegramUsername ?? user.telegramUsername,
          isTelegramMember: true,
          telegramVerifiedAt: new Date(),
          name: user.name ?? fullName ?? undefined,
        },
      });
    }

    // 4. Generar token de sesión de corta duración (2 min) para el proveedor "telegram"
    const sessionToken = generateSessionToken(user.id);

    return NextResponse.json({
      success: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        telegramId: user.telegramId,
        isTelegramMember: user.isTelegramMember,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en autenticación Telegram:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
