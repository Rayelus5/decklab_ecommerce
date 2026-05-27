import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priceMonthly: z.number().positive().optional(),
  monthlyAllowance: z.number().positive().optional(),
  stripePriceId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  benefits: z.record(z.string(), z.unknown()).optional(),
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const tier = await prisma.proTier.update({ where: { id }, data: parsed.data as never });

    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "PRO_TIER_UPDATED",
        targetId: id,
        targetType: "ProTier",
        details: JSON.parse(JSON.stringify(parsed.data)),
      },
    });

    return NextResponse.json({ ...tier, priceMonthly: Number(tier.priceMonthly), monthlyAllowance: Number(tier.monthlyAllowance) });
  } catch (error) {
    console.error("[ADMIN PRO TIER PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;

    const { id } = await params;

    const count = await prisma.user.count({ where: { proTierId: id } });
    if (count > 0) {
      return NextResponse.json({ error: "Hay usuarios activos en este tier" }, { status: 400 });
    }

    await prisma.proTier.delete({ where: { id } });
    return NextResponse.json({ message: "Tier eliminado" });
  } catch (error) {
    console.error("[ADMIN PRO TIER DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
