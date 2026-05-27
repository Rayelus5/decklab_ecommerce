import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  image: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
  parentId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    const cat = await prisma.category.create({ data: parsed.data as never });
    return NextResponse.json(cat, { status: 201 });
  } catch (error) {
    console.error("[ADMIN CATEGORY POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
