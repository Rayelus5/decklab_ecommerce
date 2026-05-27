import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  parentId: z.string().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const cat = await prisma.category.update({ where: { id }, data: parsed.data as never });
    return NextResponse.json(cat);
  } catch (error) {
    console.error("[ADMIN CATEGORY PATCH]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const { id } = await params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) return NextResponse.json({ error: "Hay productos en esta categoría" }, { status: 400 });
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Eliminada" });
  } catch (error) {
    console.error("[ADMIN CATEGORY DELETE]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
