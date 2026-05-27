import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional(),
  type: z.enum(["ORDINARIO", "CERTIFICADO"]).optional(),
  region: z.enum(["NATIONAL", "EUROPE"]).optional(),
  minWeight: z.number().int().optional(),
  maxWeight: z.number().int().optional(),
  price: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const rate = await prisma.shippingRate.update({ where: { id }, data: parsed.data as never });
    return NextResponse.json({ ...rate, price: Number(rate.price) });
  } catch (error) {
    console.error("[ADMIN SHIPPING PATCH]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
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
    await prisma.shippingRate.delete({ where: { id } });
    return NextResponse.json({ message: "Eliminada" });
  } catch (error) {
    console.error("[ADMIN SHIPPING DELETE]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
