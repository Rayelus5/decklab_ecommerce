import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;

    const { searchParams } = new URL(req.url);
    const converted = searchParams.get("converted"); // "true" | "false" | null (todos)
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "25")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (converted === "false") {
      where.convertedAt = null;
    } else if (converted === "true") {
      where.convertedAt = { not: null };
    }

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const [carts, total] = await Promise.all([
      prisma.abandonedCart.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          stripeSessionId: true,
          cartItems: true,
          subtotal: true,
          recoveryEmailSentAt: true,
          convertedAt: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.abandonedCart.count({ where }),
    ]);

    return NextResponse.json({ carts, total, page, limit });
  } catch (error) {
    console.error("[ADMIN ABANDONED CARTS]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
