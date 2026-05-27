import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().max(40).optional(),
  line1: z.string().min(3, "La dirección es obligatoria"),
  line2: z.string().optional(),
  city: z.string().min(2, "La ciudad es obligatoria"),
  postalCode: z.string().min(4, "El código postal es obligatorio"),
  province: z.string().optional(),
  country: z.string().length(2).default("ES"),
  phone: z.string().min(6, "El teléfono es obligatorio"),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(addresses);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // If this is set as default, clear other defaults first
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    // If it's the first address, make it default automatically
    const count = await prisma.address.count({ where: { userId: session.user.id } });
    const shouldBeDefault = data.isDefault || count === 0;

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        label: data.label,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        postalCode: data.postalCode,
        province: data.province,
        country: data.country,
        phone: data.phone,
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error("[ADDRESS POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
