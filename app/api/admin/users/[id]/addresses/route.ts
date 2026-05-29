import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const createSchema = z.object({
  label: z.string().max(40).optional().nullable(),
  line1: z.string().min(3, "La dirección es obligatoria"),
  line2: z.string().optional().nullable(),
  city: z.string().min(2, "La ciudad es obligatoria"),
  postalCode: z.string().min(4, "El código postal es obligatorio"),
  province: z.string().optional().nullable(),
  country: z.string().length(2, "País inválido (código ISO de 2 letras)").default("ES"),
  phone: z.string().min(6, "El teléfono es obligatorio"),
  isDefault: z.boolean().optional().default(false),
});

/** GET /api/admin/users/[id]/addresses */
export async function GET(_req: NextRequest, { params }: Params) {
  const adminOrError = await requireAdmin();
  if (isErrorResponse(adminOrError)) return adminOrError;

  const { id: userId } = await params;

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(addresses);
}

/** POST /api/admin/users/[id]/addresses */
export async function POST(req: NextRequest, { params }: Params) {
  const adminOrError = await requireAdmin();
  if (isErrorResponse(adminOrError)) return adminOrError;

  const { id: userId } = await params;

  // Verificar que el usuario existe
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Si se marca como predeterminada, limpiar la anterior
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  // Si es la primera dirección, que sea predeterminada automáticamente
  const count = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = data.isDefault || count === 0;

  const address = await prisma.address.create({
    data: { ...data, userId, isDefault: shouldBeDefault },
  });

  return NextResponse.json(address, { status: 201 });
}
