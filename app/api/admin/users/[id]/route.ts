import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkGroupMembership } from "@/lib/telegram";
import { z } from "zod";

const updateUserSchema = z.object({
  proAllowanceBalance: z.number().min(0).optional(),
  isTelegramMember: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
  // Gestión PRO manual
  isPro: z.boolean().optional(),
  proTierId: z.string().nullable().optional(),
  // Vinculación de Telegram
  telegramId: z.string().nullable().optional(),         // ID numérico como string (o null para desvincular)
  telegramUsername: z.string().nullable().optional(),   // @username sin @ (o null)
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const {
      proAllowanceBalance,
      isTelegramMember,
      isBlocked,
      role,
      isPro,
      proTierId,
      telegramId,
      telegramUsername,
    } = parsed.data;

    const updateData: Record<string, unknown> = {};

    if (proAllowanceBalance !== undefined) updateData.proAllowanceBalance = proAllowanceBalance;
    if (isTelegramMember !== undefined) updateData.isTelegramMember = isTelegramMember;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (role !== undefined) updateData.role = role;

    // Vinculación de Telegram
    if (telegramId !== undefined) {
      if (telegramId === null || telegramId === "") {
        // Desvincular Telegram
        updateData.telegramId = null;
        updateData.telegramUsername = null;
        updateData.isTelegramMember = false;
      } else {
        const numericId = parseInt(telegramId, 10);
        if (isNaN(numericId)) {
          return NextResponse.json(
            { error: "El ID de Telegram debe ser un número" },
            { status: 400 }
          );
        }
        updateData.telegramId = telegramId;
        if (telegramUsername !== undefined) {
          // Normalizar: quitar @ si lo incluyó el admin
          updateData.telegramUsername = telegramUsername
            ? telegramUsername.replace(/^@/, "")
            : null;
        }
        // Verificar membresía en el grupo automáticamente
        try {
          const isMember = await checkGroupMembership(numericId);
          updateData.isTelegramMember = isMember;
        } catch {
          // No bloquear si Telegram no responde — el admin puede ajustarlo manualmente
          console.error("[ADMIN USER PATCH] Error checking Telegram membership");
        }
      }
    } else if (telegramUsername !== undefined) {
      // Solo actualizar username sin cambiar el ID
      updateData.telegramUsername = telegramUsername
        ? telegramUsername.replace(/^@/, "")
        : null;
    }

    if (isPro !== undefined) {
      updateData.isPro = isPro;

      if (isPro) {
        // Activar PRO: asignar tier y marcar proSince si no estaba activo
        if (proTierId) updateData.proTierId = proTierId;

        // Solo actualizar proSince si el usuario no era PRO antes
        const current = await prisma.user.findUnique({
          where: { id },
          select: { isPro: true, proSince: true },
        });
        if (!current?.isPro) {
          updateData.proSince = new Date();
        }
      } else {
        // Desactivar PRO: limpiar tier y fecha
        updateData.proTierId = null;
        updateData.proSince = null;
        updateData.proAllowanceBalance = 0;
        updateData.proSubscriptionId = null;
      }
    } else if (proTierId !== undefined) {
      // Cambio de tier sin tocar isPro (el usuario ya es PRO, solo cambia de plan)
      updateData.proTierId = proTierId;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    // Log de la acción administrativa
    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "USER_UPDATED",
        targetId: id,
        targetType: "User",
        details: JSON.parse(JSON.stringify(updateData)),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN USER PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
