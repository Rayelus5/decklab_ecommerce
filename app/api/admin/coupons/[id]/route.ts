import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  code: z.string().min(2).max(30).transform((s) => s.toUpperCase()).optional(),
  type: z.enum(["PERCENT", "FIXED"]).optional(),
  value: z.number().positive().optional(),
  minOrderAmount: z.number().positive().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
  maxUsesPerUser: z.number().int().positive().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const data = parsed.data;
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        expiresAt: data.expiresAt !== undefined
          ? data.expiresAt ? new Date(data.expiresAt) : null
          : undefined,
      },
    });

    return NextResponse.json({
      ...coupon,
      value: Number(coupon.value),
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
    });
  } catch (error) {
    console.error("[ADMIN COUPON PATCH]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ message: "Cupón eliminado" });
  } catch (error) {
    console.error("[ADMIN COUPON DELETE]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
