import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string; addressId: string }> };

const updateSchema = z.object({
  label: z.string().max(40).optional().nullable(),
  line1: z.string().min(3).optional(),
  line2: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
  postalCode: z.string().min(4).optional(),
  province: z.string().optional().nullable(),
  country: z.string().length(2).optional(),
  phone: z.string().min(6).optional(),
  isDefault: z.boolean().optional(),
});

/** PATCH /api/admin/users/[id]/addresses/[addressId] */
export async function PATCH(req: NextRequest, { params }: Params) {
  const adminOrError = await requireAdmin();
  if (isErrorResponse(adminOrError)) return adminOrError;

  const { id: userId, addressId } = await params;

  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({ where: { id: addressId }, data });

  return NextResponse.json(address);
}

/** DELETE /api/admin/users/[id]/addresses/[addressId] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const adminOrError = await requireAdmin();
  if (isErrorResponse(adminOrError)) return adminOrError;

  const { id: userId, addressId } = await params;

  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
  }

  await prisma.address.delete({ where: { id: addressId } });

  // Si era la predeterminada, promover la siguiente más antigua
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return NextResponse.json({ success: true });
}
