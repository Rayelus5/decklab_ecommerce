import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100),
  email: z.string().email("Email inválido").toLowerCase(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100),
  role: z.enum(["ADMIN", "CUSTOMER"]).default("CUSTOMER"),
});

/**
 * POST /api/admin/users
 * Crea un nuevo usuario con contraseña inicial hasheada.
 * El email queda verificado automáticamente (es una cuenta creada por el admin).
 */
export async function POST(req: NextRequest) {
  try {
    const adminOrError = await requireAdmin();
    if (isErrorResponse(adminOrError)) return adminOrError;
    const adminSession = adminOrError;

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;

    // Comprobar que el email no está en uso
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        // Marcar email como verificado — cuenta creada manualmente por admin
        emailVerified: new Date(),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Log de la acción administrativa
    await prisma.adminActionLog.create({
      data: {
        adminId: adminSession.user.id,
        actionType: "USER_CREATED",
        targetId: user.id,
        targetType: "User",
        details: { name, email, role },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[ADMIN USERS POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
