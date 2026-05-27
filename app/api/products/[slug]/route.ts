import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { slug } = await params;
    const isAdmin = session.user.role === "ADMIN";

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { position: "asc" } },
        variants: {
          orderBy: { price: "asc" },
          select: {
            id: true,
            sku: true,
            title: true,
            price: true,
            pricePro: true,
            proExempt: true,
            stock: true,
            weight: true,
            attributes: true,
          },
        },
      },
    });

    if (!product || (product.isArchived && !isAdmin)) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar acceso temprano (early access)
    if (!isAdmin && product.earlyAccessTierLevel !== null) {
      if (!session.user.isPro) {
        return NextResponse.json(
          { error: "Este producto requiere suscripción PRO", code: "EARLY_ACCESS" },
          { status: 403 }
        );
      }

      // Verificar si el tier del usuario es suficiente
      const userTier = await prisma.proTier.findUnique({
        where: { id: session.user.proTierId ?? "" },
        select: { sortOrder: true },
      });

      if (!userTier || userTier.sortOrder < product.earlyAccessTierLevel) {
        return NextResponse.json(
          {
            error: `Este producto requiere Nivel ${product.earlyAccessTierLevel} o superior`,
            code: "EARLY_ACCESS_TIER",
          },
          { status: 403 }
        );
      }
    }

    // Verificar productos exclusivos
    if (!isAdmin && product.isExclusive && session.user.isPro) {
      const userTier = await prisma.proTier.findUnique({
        where: { id: session.user.proTierId ?? "" },
        select: { benefits: true },
      });

      const benefits = userTier?.benefits as Record<string, unknown> | null;
      if (!benefits?.exclusiveProducts) {
        return NextResponse.json(
          { error: "Este producto es exclusivo para tiers PRO con acceso exclusivo", code: "EXCLUSIVE" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[PRODUCT GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
