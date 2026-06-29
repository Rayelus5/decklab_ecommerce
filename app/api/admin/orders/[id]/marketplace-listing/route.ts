import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendMarketplaceListingDM } from "@/lib/telegram";

const schema = z.object({
  listingUrl: z.string().url("URL del anuncio no válida"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const { listingUrl } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        marketplaceShipping: true,
        marketplacePlatform: true,
        marketplacePayOption: true,
        user: { select: { telegramId: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (!order.marketplaceShipping) {
      return NextResponse.json({ error: "Este pedido no es de tipo marketplace" }, { status: 400 });
    }

    await prisma.order.update({
      where: { id },
      data: {
        marketplaceListingUrl: listingUrl,
        marketplaceListingStatus: "LISTING_CREATED",
      },
    });

    // Enviar DM al comprador si tiene Telegram
    if (order.user.telegramId) {
      sendMarketplaceListingDM({
        telegramId: order.user.telegramId,
        orderNumber: order.orderNumber,
        platform: order.marketplacePlatform ?? "",
        listingUrl,
        payOption: order.marketplacePayOption ?? "PLATFORM",
      }).catch((e) => console.error("[MARKETPLACE LISTING DM]", e));
    }

    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "ORDER_STATUS_CHANGED",
        targetId: id,
        targetType: "Order",
        details: { action: "MARKETPLACE_LISTING_CREATED", listingUrl },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[MARKETPLACE LISTING]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
