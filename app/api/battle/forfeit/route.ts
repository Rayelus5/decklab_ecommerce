import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  battleSessionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "battleSessionId requerido" }, { status: 400 });
    }
    const { battleSessionId } = parsed.data;

    const battleSession = await prisma.battleSession.findUnique({
      where: { id: battleSessionId },
    });

    if (!battleSession || battleSession.userId !== userId) {
      return NextResponse.json({ error: "Sesión de batalla no encontrada" }, { status: 404 });
    }

    if (battleSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "La batalla ya ha terminado" }, { status: 400 });
    }

    await prisma.battleSession.update({
      where: { id: battleSessionId },
      data: { status: "ABANDONED" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[BATTLE FORFEIT]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
