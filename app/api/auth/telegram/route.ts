import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTelegramWidgetData, checkGroupMembership } from "@/lib/telegram";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import type { TelegramAuthData } from "@/lib/telegram";

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

    // 4. Devolver datos del usuario para que el cliente inicie sesión
    return NextResponse.json({
      success: true,
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
