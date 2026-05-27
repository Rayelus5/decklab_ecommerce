import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const tierSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  priceMonthly: z.number().positive(),
  monthlyAllowance: z.number().positive(),
  stripePriceId: z.string().min(1),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  benefits: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const body = await req.json();
    const parsed = tierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const tier = await prisma.proTier.create({ data: parsed.data as never });

    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "PRO_TIER_CREATED",
        targetId: tier.id,
        targetType: "ProTier",
        details: { name: tier.name },
      },
    });

    return NextResponse.json({ ...tier, priceMonthly: Number(tier.priceMonthly), monthlyAllowance: Number(tier.monthlyAllowance) }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN PRO TIER POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
