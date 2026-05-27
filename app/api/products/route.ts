import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("q");
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "12")));
    const skip = (page - 1) * limit;
    const featured = searchParams.get("featured") === "true";

    // Determinar el nivel PRO del usuario para early access
    const userTier = session.user.isPro
      ? await prisma.proTier.findUnique({
          where: { id: session.user.proTierId ?? "" },
          select: { id: true, name: true },
        })
      : null;

    const isAdmin = session.user.role === "ADMIN";

    // Construir where clause
    const where: Record<string, unknown> = {
      isArchived: false,
    };

    // Filtrar productos con early access si el usuario no tiene el tier requerido
    if (!isAdmin) {
      if (!session.user.isPro) {
        // No PRO: solo productos sin early access
        where.earlyAccessTierLevel = null;
      }
      // Si es PRO, se filtra más adelante con Prisma
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured) {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: {
            where: { stock: { gt: 0 } },
            orderBy: { price: "asc" },
            take: 1,
            select: {
              id: true,
              title: true,
              price: true,
              pricePro: true,
              stock: true,
              proExempt: true,
            },
          },
        },
        orderBy: [
          { isFeatured: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("[PRODUCTS GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
