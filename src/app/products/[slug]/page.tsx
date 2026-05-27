import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/product/product-details";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const prisma = new PrismaClient();

// Generar rutas estáticas para SEO y rendimiento (opcional pero recomendado)
export async function generateStaticParams() {
    const products = await prisma.product.findMany({ select: { slug: true } });
    return products.map((p) => ({ slug: p.slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params; // Next.js 16 requiere await params

    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            images: true,
            variants: true,
            category: true,
        },
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            {/* Breadcrumb simple */}
            <Link
                href="/products"
                className="inline-flex items-center gap-2 text-body text-whisper-blue hover:text-ghost-white transition-colors mb-8"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver al catálogo
            </Link>

            <ProductDetails product={product} />
        </div>
    );
}