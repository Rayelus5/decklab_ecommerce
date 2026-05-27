import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const variantSchema = z.object({
  sku: z.string().min(1),
  title: z.string().optional().nullable(),
  price: z.number().positive(),
  pricePro: z.number().positive().optional().nullable(),
  proExempt: z.boolean().default(false),
  stock: z.number().int().min(0),
  weight: z.number().int().min(0),
});

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  position: z.number().int().min(0).default(0),
});

const productSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().default(""),
  categoryId: z.string().optional().nullable(),
  isArchived: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isExclusive: z.boolean().default(false),
  earlyAccessTierLevel: z.number().int().min(1).max(10).optional().nullable(),
  noReturns: z.boolean().default(true),
  probabilityData: z.unknown().optional().nullable(),
  variants: z.array(variantSchema).min(1),
  images: z.array(imageSchema).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const { variants, images, ...productData } = parsed.data;

    const product = await prisma.product.create({
      data: {
        title: productData.title,
        slug: productData.slug,
        description: productData.description,
        categoryId: productData.categoryId ?? null,
        isArchived: productData.isArchived,
        isFeatured: productData.isFeatured,
        isExclusive: productData.isExclusive,
        earlyAccessTierLevel: productData.earlyAccessTierLevel ?? null,
        noReturns: productData.noReturns,
        probabilityData: productData.probabilityData as never ?? null,
        variants: {
          create: variants.map((v) => ({
            sku: v.sku,
            title: v.title,
            price: v.price,
            pricePro: v.pricePro,
            proExempt: v.proExempt,
            stock: v.stock,
            weight: v.weight,
          })),
        },
        images: {
          create: images.map((img, pos) => ({
            url: img.url,
            alt: img.alt,
            position: img.position ?? pos,
          })),
        },
      },
    });

    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "PRODUCT_CREATED",
        targetId: product.id,
        targetType: "Product",
        details: { title: product.title, slug: product.slug },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[ADMIN PRODUCT POST]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
