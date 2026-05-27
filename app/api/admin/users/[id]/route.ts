import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  proAllowanceBalance: z.number().min(0).optional(),
  isTelegramMember: z.boolean().optional(),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
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

    const { proAllowanceBalance, isTelegramMember, role } = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (proAllowanceBalance !== undefined) updateData.proAllowanceBalance = proAllowanceBalance;
    if (isTelegramMember !== undefined) updateData.isTelegramMember = isTelegramMember;
    if (role !== undefined) updateData.role = role;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

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
