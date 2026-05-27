import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1),
  title: z.string().optional().nullable(),
  price: z.number().positive(),
  pricePro: z.number().positive().optional().nullable(),
  proExempt: z.boolean().default(false),
  stock: z.number().int().min(0),
  weight: z.number().int().min(0),
});

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url(),
  alt: z.string().optional().nullable(),
  position: z.number().int().min(0).default(0),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  isArchived: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isExclusive: z.boolean().optional(),
  earlyAccessTierLevel: z.number().int().optional().nullable(),
  noReturns: z.boolean().optional(),
  probabilityData: z.unknown().optional().nullable(),
  variants: z.array(variantSchema).optional(),
  images: z.array(imageSchema).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }

    const { variants, images, ...productData } = parsed.data;

    // Update product scalars
    const product = await prisma.product.update({
      where: { id },
      data: productData as never,
    });

    // Rebuild images if provided
    if (images !== undefined) {
      const keepImageIds = images.filter((img) => img.id).map((img) => img.id as string);
      // Delete images not in the new set
      await prisma.productImage.deleteMany({
        where: {
          productId: id,
          ...(keepImageIds.length > 0 ? { id: { notIn: keepImageIds } } : {}),
        },
      });

      await Promise.all(
        images.map((img, pos) =>
          img.id
            ? prisma.productImage.update({
                where: { id: img.id },
                data: { url: img.url, alt: img.alt, position: img.position ?? pos },
              })
            : prisma.productImage.create({
                data: {
                  productId: id,
                  url: img.url,
                  alt: img.alt,
                  position: img.position ?? pos,
                },
              })
        )
      );
    }

    // Rebuild variants if provided
    if (variants && variants.length > 0) {
      // Delete existing variants not in the new set
      const keepIds = variants.filter((v) => v.id).map((v) => v.id as string);
      if (keepIds.length > 0) {
        await prisma.productVariant.deleteMany({
          where: { productId: id, id: { notIn: keepIds } },
        });
      } else {
        await prisma.productVariant.deleteMany({ where: { productId: id } });
      }

      // Upsert variants
      await Promise.all(
        variants.map((v) =>
          v.id
            ? prisma.productVariant.update({
                where: { id: v.id },
                data: {
                  sku: v.sku,
                  title: v.title,
                  price: v.price,
                  pricePro: v.pricePro,
                  proExempt: v.proExempt,
                  stock: v.stock,
                  weight: v.weight,
                },
              })
            : prisma.productVariant.create({
                data: {
                  productId: id,
                  sku: v.sku,
                  title: v.title,
                  price: v.price,
                  pricePro: v.pricePro,
                  proExempt: v.proExempt,
                  stock: v.stock,
                  weight: v.weight,
                },
              })
        )
      );
    }

    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "PRODUCT_UPDATED",
        targetId: id,
        targetType: "Product",
        details: { title: product.title },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[ADMIN PRODUCT PATCH]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionOrError = await requireAdmin();
    if (isErrorResponse(sessionOrError)) return sessionOrError;
    const session = sessionOrError;

    const { id } = await params;

    // Soft delete (archive)
    const product = await prisma.product.update({
      where: { id },
      data: { isArchived: true },
    });

    await prisma.adminActionLog.create({
      data: {
        adminId: session.user.id,
        actionType: "PRODUCT_DELETED",
        targetId: id,
        targetType: "Product",
        details: { title: product.title },
      },
    });

    return NextResponse.json({ message: "Producto archivado" });
  } catch (error) {
    console.error("[ADMIN PRODUCT DELETE]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
