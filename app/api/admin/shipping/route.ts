import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["ORDINARIO", "CERTIFICADO"]),
  region: z.enum(["NATIONAL", "EUROPE"]),
  minWeight: z.number().int().min(0),
  maxWeight: z.number().int(),
  price: z.number().min(0),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const body = await req.json();
    const parsed = rateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const rate = await prisma.shippingRate.create({ data: parsed.data as never });
    return NextResponse.json({ ...rate, price: Number(rate.price) }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN SHIPPING POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
