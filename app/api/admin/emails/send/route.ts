import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { render } from "@react-email/render";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { CustomEmail, type EmailVariant } from "@/emails/custom-email";

const BATCH_SIZE = 100;

const sendSchema = z.object({
  recipientFilter: z.enum(["all", "pro", "specific"]),
  userIds: z.array(z.string()).optional(),
  subject: z.string().min(3, "El asunto debe tener al menos 3 caracteres"),
  variant: z.enum(["announcement", "promotion", "news"]),
  heading: z.string().min(3, "El encabezado debe tener al menos 3 caracteres"),
  body: z.string().min(10, "El cuerpo debe tener al menos 10 caracteres"),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url("La URL del CTA no es válida").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  const adminResult = await requireAdmin();
  if (isErrorResponse(adminResult)) return adminResult;

  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const {
      recipientFilter,
      userIds,
      subject,
      variant,
      heading,
      body: emailBody,
      ctaText,
      ctaUrl,
    } = parsed.data;

    // 1. Determinar destinatarios
    let whereClause: Prisma.UserWhereInput;

    if (recipientFilter === "all") {
      whereClause = {};
    } else if (recipientFilter === "pro") {
      whereClause = { isPro: true };
    } else {
      // specific
      if (!userIds?.length) {
        return NextResponse.json(
          { error: "Debes seleccionar al menos un usuario" },
          { status: 400 }
        );
      }
      whereClause = { id: { in: userIds } };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { email: true },
    });

    const emails = users
      .map((u) => u.email)
      .filter((e): e is string => typeof e === "string" && e.length > 0);

    if (emails.length === 0) {
      return NextResponse.json(
        { error: "No hay destinatarios con email válido para el filtro seleccionado" },
        { status: 400 }
      );
    }

    // 2. Renderizar template una sola vez (nombre genérico para emails masivos)
    const html = await render(
      CustomEmail({
        customerName: "Cliente",
        heading,
        body: emailBody,
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
        variant: variant as EmailVariant,
      })
    );

    // 3. Enviar en lotes de BATCH_SIZE
    let sent = 0;

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      await resend.batch.send(
        batch.map((to) => ({
          from: FROM_EMAIL,
          to,
          subject,
          html,
        }))
      );
      sent += batch.length;
    }

    return NextResponse.json({ sent, recipients: emails.length });
  } catch (error) {
    console.error("[ADMIN EMAILS SEND]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
