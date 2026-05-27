import { PrismaClient } from "@prisma/client";
import { ProductCard } from "@/components/product/product-card";

const prisma = new PrismaClient();

async function getProducts() {
    return await prisma.product.findMany({
        where: { isArchived: false },
        include: {
            images: true,
            category: true,
            variants: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[rgba(186,215,247,0.12)] pb-6">
                <div>
                    <h1 className="text-heading-lg md:text-display font-aeonikpro font-medium text-ghost-white">
                        Catálogo
                    </h1>
                    <p className="mt-2 text-body text-whisper-blue max-w-lg">
                        Explora nuestra colección de barajas premium y accesorios.
                        Únete a PRO para acceder a precios exclusivos.
                    </p>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 text-whisper-blue text-body">
                    No hay productos disponibles en este momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
