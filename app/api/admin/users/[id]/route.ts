import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  proAllowanceBalance: z.number().min(0).optional(),
  isTelegramMember: z.boolean().optional(),
  isBlocked: z.boolean().optional(),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
  // Gestión PRO manual
  isPro: z.boolean().optional(),
  proTierId: z.string().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

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
    } = parsed.data;

    const updateData: Record<string, unknown> = {};

    if (proAllowanceBalance !== undefined) updateData.proAllowanceBalance = proAllowanceBalance;
    if (isTelegramMember !== undefined) updateData.isTelegramMember = isTelegramMember;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked;
    if (role !== undefined) updateData.role = role;

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
